#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use linera_sdk::{
    linera_base_types::{ChainId, WithContractAbi},
    views::{RootView, View},
    Contract, ContractRuntime,
};

use flappy::{
    ApplicationParameters, FlappyMessage, InstantiationArgument, LoginResult, Operation,
    PracticeEntry, Tournament, TournamentResult, TournamentStatus, User, UserRole,
};

use self::state::FlappyState;

pub struct FlappyContract {
    state: FlappyState,
    runtime: ContractRuntime<Self>,
}

linera_sdk::contract!(FlappyContract);

impl WithContractAbi for FlappyContract {
    type Abi = flappy::FlappyAbi;
}

impl Contract for FlappyContract {
    type Message = FlappyMessage;
    type Parameters = ApplicationParameters;
    type InstantiationArgument = InstantiationArgument;
    type EventValue = ();

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = FlappyState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        FlappyContract { state, runtime }
    }

    async fn instantiate(&mut self, args: Self::InstantiationArgument) {
        self.state.player_name.set(args.player_name);
        self.state.top_leaderboard.set(Vec::new());
        self.state.is_leaderboard_chain.set(false);
        self.state.leaderboard_chain_id.set(None);

        // Initialize user management fields
        self.state.current_user.set(None);

        // Initialize practice mode fields
        self.state.practice_leaderboard.set(Vec::new());
        self.state.my_practice_scores.set(Vec::new());
        self.state.my_practice_best.set(0);

        // Initialize tournament fields
        self.state.pinned_tournaments.set(Vec::new());
        self.state.tournament_counter.set(0);
        self.state.my_tournaments.set(Vec::new());

        // Create admin user if provided (only for leaderboard chain setup)
        if let (Some(admin_username), Some(admin_hash)) = (args.admin_username, args.admin_hash) {
            let admin_user = User {
                username: admin_username.clone(),
                hash: admin_hash,
                role: UserRole::Admin,
                created_at: self.runtime.system_time().micros(),
                chain_id: Some(self.runtime.chain_id()),
            };

            self.state
                .users
                .insert(&admin_username, admin_user)
                .expect("Failed to create admin user");
        }
    }

    async fn execute_operation(&mut self, operation: Self::Operation) -> Self::Response {
        // Auto-update tournament statuses based on time before processing any operation
        if *self.state.is_leaderboard_chain.get() {
            self.update_tournament_statuses().await;
        }

        match operation {
            Operation::SetupGame {
                leaderboard_chain_id,
                leaderboard_name,
            } => {
                // Only allow setup if not already configured
                if self.state.leaderboard_chain_id.get().is_some() {
                    panic!("Game already configured. Leaderboard chain is already set.");
                }

                // Set the leaderboard chain ID for all chains
                self.state
                    .leaderboard_chain_id
                    .set(Some(leaderboard_chain_id));

                // If this chain is being designated as the leaderboard chain
                if self.runtime.chain_id() == leaderboard_chain_id {
                    self.state.is_leaderboard_chain.set(true);
                }

                self.state.player_name.set(leaderboard_name);

                // The player name for each chain is already set during instantiation
                // from the json-argument, so we don't need to update it here
            }

            Operation::LoginOrRegister {
                username,
                hash,
                requester_chain_id,
            } => {
                // Only works on leaderboard chain
                if !*self.state.is_leaderboard_chain.get() {
                    let result = LoginResult {
                        success: false,
                        user: None,
                        message: "User management only available on leaderboard chain".to_string(),
                        is_new_user: false,
                    };
                    self.state
                        .login_results
                        .insert(&requester_chain_id, result)
                        .expect("Failed to store login result");
                    return;
                }

                let result = match self.state.users.get(&username).await {
                    Ok(Some(existing_user)) => {
                        // User exists - check password
                        if existing_user.hash == hash {
                            // Login successful
                            LoginResult {
                                success: true,
                                user: Some(existing_user),
                                message: "Login successful".to_string(),
                                is_new_user: false,
                            }
                        } else {
                            // Wrong password
                            LoginResult {
                                success: false,
                                user: None,
                                message: "Invalid password".to_string(),
                                is_new_user: false,
                            }
                        }
                    }
                    _ => {
                        // User doesn't exist - register new user
                        let new_user = User {
                            username: username.clone(),
                            hash,
                            role: UserRole::Player, // Default role
                            created_at: self.runtime.system_time().micros(),
                            chain_id: Some(requester_chain_id),
                        };

                        match self.state.users.insert(&username, new_user.clone()) {
                            Ok(_) => LoginResult {
                                success: true,
                                user: Some(new_user),
                                message: "User registered successfully".to_string(),
                                is_new_user: true,
                            },
                            Err(_) => LoginResult {
                                success: false,
                                user: None,
                                message: "Failed to register user".to_string(),
                                is_new_user: false,
                            },
                        }
                    }
                };

                // Store result for the specific requesting chain
                self.state
                    .login_results
                    .insert(&requester_chain_id, result)
                    .expect("Failed to store login result");
            }

            Operation::DeleteUser {
                caller_chain_id,
                username,
            } => {
                // Only admins can delete users, only on leaderboard chain
                if !*self.state.is_leaderboard_chain.get() {
                    panic!("User deletion can only be done on the leaderboard chain");
                }

                // Validate admin session
                let _admin_user = self
                    .validate_admin_session(caller_chain_id)
                    .await
                    .unwrap_or_else(|msg| panic!("{}", msg));

                // Check if user exists
                match self.state.users.get(&username).await {
                    Ok(Some(user)) => {
                        // Prevent deletion of admin users (safety check)
                        if user.role == UserRole::Admin {
                            panic!("Cannot delete admin users");
                        }

                        // Remove user from users map (but keep their scores)
                        self.state
                            .users
                            .remove(&username)
                            .expect("Failed to delete user");

                        // Clean up user's login results for all chains if any exist
                        let chain_ids = self
                            .state
                            .login_results
                            .indices()
                            .await
                            .expect("Failed to get login result chain IDs");

                        for chain_id in chain_ids {
                            if let Ok(Some(login_result)) = self.state.login_results.get(&chain_id).await {
                                if let Some(result_user) = &login_result.user {
                                    if result_user.username == username {
                                        self.state
                                            .login_results
                                            .remove(&chain_id)
                                            .expect("Failed to remove login result");
                                    }
                                }
                            }
                        }

                        // Note: Practice scores and tournament scores are preserved
                        // Note: Tournament participation history is preserved
                    }
                    _ => {
                        panic!("User '{}' not found", username);
                    }
                }
            }

            Operation::SubmitPracticeScore { username, score } => {
                // Process on player chains (any chain can submit practice scores)

                // Add score to personal history
                let mut my_scores = self.state.my_practice_scores.get().clone();
                my_scores.push(score);
                self.state.my_practice_scores.set(my_scores);

                // Check if this is a new personal best
                let current_best = *self.state.my_practice_best.get();
                if score > current_best {
                    self.state.my_practice_best.set(score);

                    // Send message to leaderboard chain if configured
                    if let Some(leaderboard_id) = self.state.leaderboard_chain_id.get() {
                        let message = FlappyMessage::UpdatePracticeBest {
                            username,
                            score,
                            player_chain_id: self.runtime.chain_id(),
                        };

                        self.runtime
                            .prepare_message(message)
                            .send_to(*leaderboard_id);
                    }
                }
            }

            // Tournament management operations
            Operation::CreateTournament {
                caller_chain_id,
                name,
                description,
                start_time,
                end_time,
            } => {
                // Only admins can create tournaments, only on leaderboard chain
                if !*self.state.is_leaderboard_chain.get() {
                    panic!("Tournaments can only be created on the leaderboard chain");
                }

                // Validate admin session
                let admin_user = self
                    .validate_admin_session(caller_chain_id)
                    .await
                    .unwrap_or_else(|msg| panic!("{}", msg));

                // Generate unique tournament ID
                let counter = *self.state.tournament_counter.get();
                let tournament_id = format!("tournament_{}", counter);
                self.state.tournament_counter.set(counter + 1);

                // Validate time constraints (comparing raw seconds before conversion)
                if let (Some(start), Some(end)) = (start_time, end_time) {
                    if end <= start {
                        panic!("End time must be after start time");
                    }
                }

                // Create tournament - convert user-provided timestamps from seconds to microseconds
                let tournament = Tournament {
                    id: tournament_id.clone(),
                    name,
                    description,
                    creator: admin_user.username.clone(), // Use authenticated admin's username
                    status: TournamentStatus::Registration,
                    start_time: start_time.map(|t| t * 1_000_000), // Convert seconds to microseconds
                    end_time: end_time.map(|t| t * 1_000_000), // Convert seconds to microseconds
                    participants: Vec::new(),
                    results: Vec::new(),
                    created_at: self.runtime.system_time().micros(),
                    is_pinned: false,
                    pinned_at: None,
                    pinned_by: None,
                };

                self.state
                    .tournaments
                    .insert(&tournament_id, tournament)
                    .expect("Failed to create tournament");
            }

            Operation::JoinTournament {
                tournament_id,
                username,
            } => {
                // Tournament joining can happen on any chain, but data is stored on leaderboard chain
                if !*self.state.is_leaderboard_chain.get() {
                    panic!("Tournament joining must be done on the leaderboard chain");
                }

                // Get tournament and validate
                let mut tournament = self
                    .state
                    .tournaments
                    .get(&tournament_id)
                    .await
                    .expect("Failed to get tournament")
                    .expect("Tournament not found");

                if tournament.status == TournamentStatus::Ended {
                    panic!("Cannot join tournament that has already ended");
                }

                if tournament.participants.contains(&username) {
                    panic!("User already joined this tournament");
                }

                // Add user to tournament
                tournament.participants.push(username);
                self.state
                    .tournaments
                    .insert(&tournament_id, tournament)
                    .expect("Failed to update tournament");
            }

            Operation::StartTournament {
                caller_chain_id,
                tournament_id,
            } => {
                // Only admins can start tournaments, only on leaderboard chain
                if !*self.state.is_leaderboard_chain.get() {
                    panic!("Tournaments can only be started on the leaderboard chain");
                }

                // Validate admin session
                let _admin_user = self
                    .validate_admin_session(caller_chain_id)
                    .await
                    .unwrap_or_else(|msg| panic!("{}", msg));

                let mut tournament = self
                    .state
                    .tournaments
                    .get(&tournament_id)
                    .await
                    .expect("Failed to get tournament")
                    .expect("Tournament not found");

                if tournament.status != TournamentStatus::Registration {
                    panic!("Tournament is not in registration phase");
                }

                tournament.status = TournamentStatus::Active;
                if tournament.start_time.is_none() {
                    tournament.start_time = Some(self.runtime.system_time().micros());
                }

                self.state
                    .tournaments
                    .insert(&tournament_id, tournament)
                    .expect("Failed to update tournament");
            }

            Operation::EndTournament {
                caller_chain_id,
                tournament_id,
                results,
            } => {
                // Only admins can end tournaments, only on leaderboard chain
                if !*self.state.is_leaderboard_chain.get() {
                    panic!("Tournaments can only be ended on the leaderboard chain");
                }

                // Validate admin session
                let _admin_user = self
                    .validate_admin_session(caller_chain_id)
                    .await
                    .unwrap_or_else(|msg| panic!("{}", msg));

                let mut tournament = self
                    .state
                    .tournaments
                    .get(&tournament_id)
                    .await
                    .expect("Failed to get tournament")
                    .expect("Tournament not found");

                if tournament.status != TournamentStatus::Active {
                    panic!("Tournament is not active");
                }

                tournament.status = TournamentStatus::Ended;
                tournament.end_time = Some(self.runtime.system_time().micros());
                tournament.results = results;

                self.state
                    .tournaments
                    .insert(&tournament_id, tournament)
                    .expect("Failed to update tournament");
            }

            Operation::PinTournament {
                caller_chain_id,
                tournament_id,
                pin,
            } => {
                // Only admins can pin tournaments, only on leaderboard chain
                if !*self.state.is_leaderboard_chain.get() {
                    panic!("Tournaments can only be pinned on the leaderboard chain");
                }

                // Validate admin session
                let admin_user = self
                    .validate_admin_session(caller_chain_id)
                    .await
                    .unwrap_or_else(|msg| panic!("{}", msg));

                let mut tournament = self
                    .state
                    .tournaments
                    .get(&tournament_id)
                    .await
                    .expect("Failed to get tournament")
                    .expect("Tournament not found");

                tournament.is_pinned = pin;
                if pin {
                    tournament.pinned_at = Some(self.runtime.system_time().micros());
                    tournament.pinned_by = Some(admin_user.username.clone()); // Use authenticated admin's username

                    // Add to pinned list if not already there
                    let mut pinned = self.state.pinned_tournaments.get().clone();
                    if !pinned.contains(&tournament_id) {
                        pinned.push(tournament_id.clone());
                        self.state.pinned_tournaments.set(pinned);
                    }
                } else {
                    tournament.pinned_at = None;
                    tournament.pinned_by = None;

                    // Remove from pinned list
                    let mut pinned = self.state.pinned_tournaments.get().clone();
                    pinned.retain(|id| id != &tournament_id);
                    self.state.pinned_tournaments.set(pinned);
                }

                self.state
                    .tournaments
                    .insert(&tournament_id, tournament)
                    .expect("Failed to update tournament");
            }

            Operation::DeleteTournament {
                caller_chain_id,
                tournament_id,
            } => {
                // Only admins can delete tournaments, only on leaderboard chain
                if !*self.state.is_leaderboard_chain.get() {
                    panic!("Tournaments can only be deleted on the leaderboard chain");
                }

                // Validate admin session
                let _admin_user = self
                    .validate_admin_session(caller_chain_id)
                    .await
                    .unwrap_or_else(|msg| panic!("{}", msg));

                let _tournament = self
                    .state
                    .tournaments
                    .get(&tournament_id)
                    .await
                    .expect("Failed to get tournament")
                    .expect("Tournament not found");

                // Remove from tournaments map
                self.state
                    .tournaments
                    .remove(&tournament_id)
                    .expect("Failed to delete tournament");

                // Remove from pinned list if present
                let mut pinned = self.state.pinned_tournaments.get().clone();
                pinned.retain(|id| id != &tournament_id);
                self.state.pinned_tournaments.set(pinned);
            }

            Operation::UpdateTournament {
                caller_chain_id,
                tournament_id,
                name,
                description,
                start_time,
                end_time,
            } => {
                // Only admins can update tournaments, only on leaderboard chain
                if !*self.state.is_leaderboard_chain.get() {
                    panic!("Tournaments can only be updated on the leaderboard chain");
                }

                // Validate admin session
                let _admin_user = self
                    .validate_admin_session(caller_chain_id)
                    .await
                    .unwrap_or_else(|msg| panic!("{}", msg));

                let mut tournament = self
                    .state
                    .tournaments
                    .get(&tournament_id)
                    .await
                    .expect("Failed to get tournament")
                    .expect("Tournament not found");

                // Validate time constraints if both provided (comparing raw seconds before conversion)
                if let (Some(start), Some(end)) = (start_time, end_time) {
                    if end <= start {
                        panic!("End time must be after start time");
                    }
                }

                // Update fields - convert user-provided timestamps from seconds to microseconds
                if let Some(name) = name {
                    tournament.name = name;
                }
                if let Some(description) = description {
                    tournament.description = description;
                }
                if let Some(start_time) = start_time {
                    tournament.start_time = Some(start_time * 1_000_000); // Convert seconds to microseconds
                }
                if let Some(end_time) = end_time {
                    tournament.end_time = Some(end_time * 1_000_000); // Convert seconds to microseconds
                }

                self.state
                    .tournaments
                    .insert(&tournament_id, tournament)
                    .expect("Failed to update tournament");
            }

            Operation::SubmitTournamentScore {
                tournament_id,
                username,
                score,
            } => {
                // Can be submitted on any chain, but forwards to leaderboard chain for processing
                if !*self.state.is_leaderboard_chain.get() {
                    // Forward to leaderboard chain
                    if let Some(leaderboard_id) = self.state.leaderboard_chain_id.get() {
                        let message = FlappyMessage::SubmitTournamentScore {
                            tournament_id: tournament_id.clone(),
                            username,
                            score,
                            player_chain_id: self.runtime.chain_id(),
                        };

                        self.runtime
                            .prepare_message(message)
                            .send_to(*leaderboard_id);
                    }

                    // Also store locally for player's personal history
                    let mut my_scores =
                        match self.state.my_tournament_scores.get(&tournament_id).await {
                            Ok(Some(scores)) => scores,
                            _ => Vec::new(),
                        };
                    my_scores.push(score);
                    self.state
                        .my_tournament_scores
                        .insert(&tournament_id, my_scores)
                        .expect("Failed to update personal tournament scores");
                } else {
                    // Process directly on leaderboard chain
                    self.process_tournament_score(tournament_id, username, score)
                        .await;
                }
            }
        }
    }

    async fn execute_message(&mut self, message: Self::Message) {
        // Check if message is bouncing
        let is_bouncing = self
            .runtime
            .message_is_bouncing()
            .unwrap_or_else(|| panic!("Message delivery status must be available"));

        if is_bouncing {
            return;
        }

        // Auto-update tournament statuses before processing messages
        if *self.state.is_leaderboard_chain.get() {
            self.update_tournament_statuses().await;
        }

        match message {
            FlappyMessage::UpdatePracticeBest {
                username,
                score,
                player_chain_id,
            } => {
                // Only process on leaderboard chain
                if !*self.state.is_leaderboard_chain.get() {
                    return;
                }

                // Create practice entry with current timestamp
                let timestamp = self.runtime.system_time().micros();
                let practice_entry = PracticeEntry {
                    username: username.clone(),
                    score,
                    chain_id: player_chain_id,
                    timestamp,
                };

                // Update user's best practice score (player chain already verified it's best)
                self.state
                    .practice_best_scores
                    .insert(&username, practice_entry)
                    .expect("Failed to update practice best score");

                // Update global top 100 practice leaderboard
                self.update_practice_leaderboard().await;
            }

            // Tournament messages
            FlappyMessage::SubmitTournamentScore {
                tournament_id,
                username,
                score,
                player_chain_id: _,
            } => {
                // Only process on leaderboard chain
                if !*self.state.is_leaderboard_chain.get() {
                    return;
                }

                // Process the tournament score
                self.process_tournament_score(tournament_id, username, score)
                    .await;
            }

            FlappyMessage::TournamentUpdate {
                tournament_id,
                tournament,
            } => {
                // Update local tournament cache on player chains
                if !*self.state.is_leaderboard_chain.get() {
                    self.state
                        .tournaments
                        .insert(&tournament_id, tournament)
                        .expect("Failed to update tournament cache");
                }
            }

            FlappyMessage::RequestTournamentData {
                tournament_id,
                requester_chain_id,
            } => {
                // Only process on leaderboard chain
                if !*self.state.is_leaderboard_chain.get() {
                    return;
                }

                if let Ok(Some(tournament)) = self.state.tournaments.get(&tournament_id).await {
                    let response = FlappyMessage::TournamentUpdate {
                        tournament_id,
                        tournament,
                    };

                    self.runtime
                        .prepare_message(response)
                        .send_to(requester_chain_id);
                }
            }
        }
    }

    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }
}

impl FlappyContract {
    async fn update_practice_leaderboard(&mut self) {
        // Collect all practice scores
        let mut all_practice_scores = Vec::new();

        // Get all usernames who have practice scores
        let usernames = self
            .state
            .practice_best_scores
            .indices()
            .await
            .expect("Failed to get practice score usernames");

        for username in usernames {
            if let Ok(Some(entry)) = self.state.practice_best_scores.get(&username).await {
                all_practice_scores.push(entry);
            }
        }

        // Sort by score descending (highest first)
        all_practice_scores.sort_by(|a, b| b.score.cmp(&a.score));

        // Take top 100 and update the leaderboard
        let top_100: Vec<PracticeEntry> = all_practice_scores.into_iter().take(100).collect();

        self.state.practice_leaderboard.set(top_100);
    }

    async fn process_tournament_score(
        &mut self,
        tournament_id: String,
        username: String,
        score: u64,
    ) {
        // Get tournament and validate it's active
        let tournament = match self.state.tournaments.get(&tournament_id).await {
            Ok(Some(tournament)) => tournament,
            _ => return, // Tournament not found
        };

        if tournament.status != TournamentStatus::Active {
            return; // Tournament not active
        }

        if !tournament.participants.contains(&username) {
            return; // User not registered for this tournament
        }

        // Update live tournament leaderboard directly
        self.update_tournament_leaderboard_with_score(&tournament_id, username, score)
            .await;
    }

    async fn update_tournament_leaderboard_with_score(
        &mut self,
        tournament_id: &str,
        username: String,
        new_score: u64,
    ) {
        // Get current leaderboard
        let mut leaderboard = match self.state.tournament_leaderboards.get(tournament_id).await {
            Ok(Some(lb)) => lb,
            _ => Vec::new(),
        };

        // Find existing entry for this user
        let existing_entry = leaderboard
            .iter_mut()
            .find(|entry| entry.username == username);

        if let Some(entry) = existing_entry {
            // Update score if it's better
            if new_score > entry.score {
                entry.score = new_score;
                entry.timestamp = self.runtime.system_time().micros();
            }
        } else {
            // Add new entry for this user
            leaderboard.push(TournamentResult {
                username,
                score: new_score,
                rank: 0, // Will be set after sorting
                chain_id: self.runtime.chain_id(),
                timestamp: self.runtime.system_time().micros(),
            });
        }

        // Sort by score descending (highest first)
        leaderboard.sort_by(|a, b| b.score.cmp(&a.score));

        // Assign ranks
        for (index, result) in leaderboard.iter_mut().enumerate() {
            result.rank = (index + 1) as u32;
        }

        // Store the updated leaderboard
        self.state
            .tournament_leaderboards
            .insert(tournament_id, leaderboard)
            .expect("Failed to update tournament leaderboard");
    }

    async fn validate_admin_session(&self, caller_chain_id: ChainId) -> Result<User, String> {
        // Get login result for the caller's chain
        let login_result = self
            .state
            .login_results
            .get(&caller_chain_id)
            .await
            .map_err(|_| "Failed to get login result".to_string())?
            .ok_or("No login session found - please login first".to_string())?;

        // Validate login was successful
        if !login_result.success {
            return Err("Invalid login session".to_string());
        }

        // Get user from login result
        let user = login_result
            .user
            .ok_or("No user in login result".to_string())?;

        // Validate user is admin
        if user.role != UserRole::Admin {
            return Err("Access denied: Admin role required".to_string());
        }

        Ok(user)
    }

    async fn update_tournament_statuses(&mut self) {
        let current_time = self.runtime.system_time().micros();

        // Get all tournament IDs
        let tournament_ids = match self.state.tournaments.indices().await {
            Ok(ids) => ids,
            Err(_) => return,
        };

        for tournament_id in tournament_ids {
            if let Ok(Some(mut tournament)) = self.state.tournaments.get(&tournament_id).await {
                let mut updated = false;

                // Auto-start tournament if it's time and still in Registration
                if tournament.status == TournamentStatus::Registration {
                    if let Some(start_time) = tournament.start_time {
                        if current_time >= start_time {
                            tournament.status = TournamentStatus::Active;
                            updated = true;

                            #[cfg(test)]
                            println!(
                                "Auto-started tournament {} at time {}",
                                tournament_id, current_time
                            );
                        }
                    }
                }

                // Auto-end tournament if it's time and still Active
                if tournament.status == TournamentStatus::Active {
                    if let Some(end_time) = tournament.end_time {
                        if current_time >= end_time {
                            tournament.status = TournamentStatus::Ended;
                            tournament.end_time = Some(current_time);

                            // Generate final results from current leaderboard
                            if let Ok(Some(leaderboard)) =
                                self.state.tournament_leaderboards.get(&tournament_id).await
                            {
                                tournament.results = leaderboard;
                            }

                            updated = true;

                            #[cfg(test)]
                            println!(
                                "Auto-ended tournament {} at time {}",
                                tournament_id, current_time
                            );
                        }
                    }
                }

                if updated {
                    self.state
                        .tournaments
                        .insert(&tournament_id, tournament)
                        .expect("Failed to update tournament status");
                }
            }
        }
    }
}
