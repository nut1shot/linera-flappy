#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use linera_sdk::{
    linera_base_types::WithContractAbi,
    views::{RootView, View},
    Contract, ContractRuntime,
};

use flappy::{ApplicationParameters, FlappyMessage, LeaderboardEntry, Operation};

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
    type InstantiationArgument = String; // player_name
    type EventValue = ();

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = FlappyState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        FlappyContract { state, runtime }
    }

    async fn instantiate(&mut self, player_name: Self::InstantiationArgument) {
        self.state.value.set(0);
        self.state.best.set(0);
        self.state.player_name.set(player_name);
        self.state.top_leaderboard.set(Vec::new());
        self.state.is_leaderboard_chain.set(false);
        self.state.leaderboard_chain_id.set(None);
    }

    async fn execute_operation(&mut self, operation: Self::Operation) -> Self::Response {
        match operation {
            Operation::Increment { value } => {
                self.state.value.set(self.state.value.get() + value);
            }

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

            Operation::SetBestAndSubmit => {
                let current = *self.state.value.get();
                let best = *self.state.best.get();

                // Update best score if current is higher
                if current > best {
                    self.state.best.set(current);

                    // Only submit if we're NOT the leaderboard chain and leaderboard is set
                    if !*self.state.is_leaderboard_chain.get() {
                        if let Some(leaderboard_id) = self.state.leaderboard_chain_id.get() {
                            let player_name = self.state.player_name.get().clone();

                            let message = FlappyMessage::SubmitScore {
                                player_name,
                                score: current,
                                chain_id: self.runtime.chain_id(),
                            };

                            self.runtime
                                .prepare_message(message)
                                .send_to(*leaderboard_id);
                        }
                    }
                }

                // Reset current value to 0
                self.state.value.set(0);
            }

            Operation::RequestLeaderboard => {
                // Only request if we're NOT the leaderboard chain and leaderboard is set
                if !*self.state.is_leaderboard_chain.get() {
                    if let Some(leaderboard_id) = self.state.leaderboard_chain_id.get() {
                        let message = FlappyMessage::RequestLeaderboard {
                            requester_chain_id: self.runtime.chain_id(),
                        };

                        self.runtime
                            .prepare_message(message)
                            .send_to(*leaderboard_id);
                    }
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

        match message {
            FlappyMessage::SubmitScore {
                player_name,
                score,
                chain_id,
            } => {
                // Only process on leaderboard chain
                if !*self.state.is_leaderboard_chain.get() {
                    return;
                }

                // Update player score if it's better
                let should_update = match self.state.player_scores.get(&player_name).await {
                    Ok(Some(existing)) => score > existing.score,
                    _ => true,
                };

                if should_update {
                    // Get current timestamp in microseconds
                    let timestamp = self.runtime.system_time().micros();
                    let entry = LeaderboardEntry {
                        player_name: player_name.clone(),
                        score,
                        chain_id,
                        timestamp,
                    };

                    self.state
                        .player_scores
                        .insert(&player_name, entry)
                        .expect("Failed to update player score");

                    // Update top leaderboard
                    self.update_top_leaderboard().await;
                }
            }

            FlappyMessage::RequestLeaderboard { requester_chain_id } => {
                // Only process on leaderboard chain
                if !*self.state.is_leaderboard_chain.get() {
                    return;
                }

                let leaderboard = self.state.top_leaderboard.get().clone();
                let response = FlappyMessage::LeaderboardUpdate {
                    entries: leaderboard,
                };

                self.runtime
                    .prepare_message(response)
                    .send_to(requester_chain_id);
            }

            FlappyMessage::LeaderboardUpdate { entries } => {
                // Update local leaderboard cache on player chains
                self.state.top_leaderboard.set(entries);
            }
        }
    }

    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }
}

impl FlappyContract {
    async fn update_top_leaderboard(&mut self) {
        // Collect all scores
        let mut all_scores = Vec::new();

        // This is a simplified version - in production, you'd want to optimize this
        let keys = self
            .state
            .player_scores
            .indices()
            .await
            .expect("Failed to get player names");

        for player_name in keys {
            if let Ok(Some(entry)) = self.state.player_scores.get(&player_name).await {
                all_scores.push(entry);
            }
        }

        // Sort by score descending
        all_scores.sort_by(|a, b| b.score.cmp(&a.score));

        // Take top 10
        let top_10: Vec<LeaderboardEntry> = all_scores.into_iter().take(10).collect();

        self.state.top_leaderboard.set(top_10);
    }
}
