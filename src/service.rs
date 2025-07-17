#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use std::sync::Arc;

use async_graphql::{EmptySubscription, Object, Schema};
use linera_sdk::{
    graphql::GraphQLMutationRoot, linera_base_types::WithServiceAbi, views::View, Service,
    ServiceRuntime,
};

use flappy::{ApplicationParameters, LeaderboardEntry, Operation, User, LoginResult, PracticeEntry, Tournament, TournamentResult};

use self::state::FlappyState;

pub struct FlappyService {
    state: FlappyState,
    runtime: Arc<ServiceRuntime<Self>>,
}

linera_sdk::service!(FlappyService);

impl WithServiceAbi for FlappyService {
    type Abi = flappy::FlappyAbi;
}

impl Service for FlappyService {
    type Parameters = ApplicationParameters;

    async fn new(runtime: ServiceRuntime<Self>) -> Self {
        let state = FlappyState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        FlappyService {
            state,
            runtime: Arc::new(runtime),
        }
    }

    async fn handle_query(&self, query: Self::Query) -> Self::QueryResponse {
        let player_name = self.state.player_name.get().clone();
        let is_leaderboard = *self.state.is_leaderboard_chain.get();
        let leaderboard = self.state.top_leaderboard.get().clone();
        
        // User management fields
        let current_user = self.state.current_user.get().clone();

        // Precompute all login results for the GraphQL query
        let mut all_login_results = std::collections::HashMap::new();
        let chain_ids = self.state.login_results.indices().await.unwrap_or_default();
        for chain_id in chain_ids {
            if let Ok(Some(result)) = self.state.login_results.get(&chain_id).await {
                all_login_results.insert(chain_id.to_string(), result);
            }
        }

        // Practice mode fields
        let practice_leaderboard = self.state.practice_leaderboard.get().clone();
        let my_practice_scores = self.state.my_practice_scores.get().clone();
        let my_practice_best = *self.state.my_practice_best.get();

        // Tournament fields
        let my_tournaments = self.state.my_tournaments.get().clone();
        
        // Precompute tournament data for GraphQL
        let mut all_tournaments = std::collections::HashMap::new();
        let mut all_tournament_leaderboards = std::collections::HashMap::new();
        let mut my_tournament_scores_map = std::collections::HashMap::new();
        
        // Get tournament data
        let tournament_ids = self.state.tournaments.indices().await.unwrap_or_default();
        for tournament_id in tournament_ids {
            if let Ok(Some(tournament)) = self.state.tournaments.get(&tournament_id).await {
                all_tournaments.insert(tournament_id.clone(), tournament);
            }
            
            if let Ok(Some(leaderboard)) = self.state.tournament_leaderboards.get(&tournament_id).await {
                all_tournament_leaderboards.insert(tournament_id.clone(), leaderboard);
            }
        }
        
        // Get personal tournament scores
        for tournament_id in &my_tournaments {
            if let Ok(Some(scores)) = self.state.my_tournament_scores.get(tournament_id).await {
                my_tournament_scores_map.insert(tournament_id.clone(), scores);
            }
        }
        
        let pinned_tournaments = self.state.pinned_tournaments.get().clone();

        Schema::build(
            QueryRoot {
                player_name,
                is_leaderboard,
                leaderboard,
                current_user,
                all_login_results,
                practice_leaderboard,
                my_practice_scores,
                my_practice_best,
                all_tournaments,
                all_tournament_leaderboards,
                my_tournaments,
                my_tournament_scores_map,
                pinned_tournaments,
            },
            Operation::mutation_root(self.runtime.clone()),
            EmptySubscription,
        )
        .finish()
        .execute(query)
        .await
    }
}

struct QueryRoot {
    player_name: String,
    is_leaderboard: bool,
    leaderboard: Vec<LeaderboardEntry>,
    current_user: Option<User>,
    all_login_results: std::collections::HashMap<String, LoginResult>,
    practice_leaderboard: Vec<PracticeEntry>,
    my_practice_scores: Vec<u64>,
    my_practice_best: u64,
    all_tournaments: std::collections::HashMap<String, Tournament>,
    all_tournament_leaderboards: std::collections::HashMap<String, Vec<TournamentResult>>,
    my_tournaments: Vec<String>,
    my_tournament_scores_map: std::collections::HashMap<String, Vec<u64>>,
    pinned_tournaments: Vec<String>,
}

#[Object]
impl QueryRoot {
    async fn player_name(&self) -> &str {
        &self.player_name
    }

    async fn is_leaderboard_chain(&self) -> bool {
        self.is_leaderboard
    }

    async fn leaderboard(&self) -> &Vec<LeaderboardEntry> {
        &self.leaderboard
    }

    async fn my_rank(&self) -> Option<usize> {
        self.leaderboard
            .iter()
            .position(|entry| entry.player_name == self.player_name)
            .map(|pos| pos + 1)
    }

    // User management queries
    async fn current_user(&self) -> &Option<User> {
        &self.current_user
    }

    async fn login_result_for(&self, chain_id: String) -> Option<LoginResult> {
        // Look up the result from the precomputed map
        self.all_login_results.get(&chain_id).cloned()
    }

    async fn is_logged_in(&self) -> bool {
        self.current_user.is_some()
    }

    async fn user_role(&self) -> Option<String> {
        self.current_user.as_ref().map(|u| match u.role {
            flappy::UserRole::Admin => "Admin".to_string(),
            flappy::UserRole::Player => "Player".to_string(),
        })
    }

    async fn username(&self) -> Option<&String> {
        self.current_user.as_ref().map(|u| &u.username)
    }

    // Practice mode queries
    async fn practice_leaderboard(&self) -> &Vec<PracticeEntry> {
        &self.practice_leaderboard
    }

    async fn my_practice_scores(&self) -> &Vec<u64> {
        &self.my_practice_scores
    }

    async fn my_practice_best(&self) -> u64 {
        self.my_practice_best
    }

    async fn practice_best_score(&self, username: String) -> Option<PracticeEntry> {
        self.practice_leaderboard
            .iter()
            .find(|entry| entry.username == username)
            .cloned()
    }

    async fn practice_rank(&self, username: String) -> Option<usize> {
        self.practice_leaderboard
            .iter()
            .position(|entry| entry.username == username)
            .map(|pos| pos + 1)
    }

    async fn practice_leaderboard_size(&self) -> usize {
        self.practice_leaderboard.len()
    }

    // Tournament management queries
    async fn tournaments(&self) -> Vec<Tournament> {
        let mut tournaments: Vec<Tournament> = self.all_tournaments.values().cloned().collect();
        
        // Sort by pinned status first, then by creation time
        tournaments.sort_by(|a, b| {
            match (a.is_pinned, b.is_pinned) {
                (true, false) => std::cmp::Ordering::Less,  // Pinned first
                (false, true) => std::cmp::Ordering::Greater,
                _ => b.created_at.cmp(&a.created_at), // Most recent first
            }
        });
        
        tournaments
    }

    async fn tournament(&self, id: String) -> Option<Tournament> {
        self.all_tournaments.get(&id).cloned()
    }

    async fn pinned_tournaments(&self) -> Vec<Tournament> {
        let mut pinned = Vec::new();
        for tournament_id in &self.pinned_tournaments {
            if let Some(tournament) = self.all_tournaments.get(tournament_id) {
                pinned.push(tournament.clone());
            }
        }
        pinned
    }

    async fn active_tournaments(&self) -> Vec<Tournament> {
        self.all_tournaments
            .values()
            .filter(|t| matches!(t.status, flappy::TournamentStatus::Active))
            .cloned()
            .collect()
    }

    async fn my_tournaments(&self) -> Vec<Tournament> {
        let mut my_tourneys = Vec::new();
        for tournament_id in &self.my_tournaments {
            if let Some(tournament) = self.all_tournaments.get(tournament_id) {
                my_tourneys.push(tournament.clone());
            }
        }
        my_tourneys
    }

    // Tournament scoring queries
    async fn tournament_leaderboard(&self, tournament_id: String) -> Option<Vec<TournamentResult>> {
        self.all_tournament_leaderboards.get(&tournament_id).cloned()
    }

    async fn my_tournament_scores(&self, tournament_id: String) -> Option<Vec<u64>> {
        self.my_tournament_scores_map.get(&tournament_id).cloned()
    }

    async fn my_tournament_best(&self, tournament_id: String) -> Option<u64> {
        self.my_tournament_scores_map
            .get(&tournament_id)
            .and_then(|scores| scores.iter().max().copied())
    }

    async fn tournament_rank(&self, tournament_id: String, username: String) -> Option<u32> {
        self.all_tournament_leaderboards
            .get(&tournament_id)?
            .iter()
            .find(|result| result.username == username)
            .map(|result| result.rank)
    }

    async fn tournament_participant_count(&self, tournament_id: String) -> Option<usize> {
        self.all_tournaments
            .get(&tournament_id)
            .map(|tournament| tournament.participants.len())
    }

    async fn is_tournament_participant(&self, tournament_id: String, username: String) -> bool {
        self.all_tournaments
            .get(&tournament_id)
            .map(|tournament| tournament.participants.contains(&username))
            .unwrap_or(false)
    }
}
