use flappy::{LeaderboardEntry, User, LoginResult, PracticeEntry, Tournament, TournamentResult};
use linera_sdk::linera_base_types::ChainId;
use linera_sdk::views::{linera_views, MapView, RegisterView, RootView, ViewStorageContext};

#[derive(RootView, async_graphql::SimpleObject)]
#[view(context = "ViewStorageContext")]
pub struct FlappyState {
    // Tournament leaderboard fields (keep for Feature 3)
    pub player_name: RegisterView<String>,
    pub player_scores: MapView<String, LeaderboardEntry>, // For leaderboard chain: all player scores
    pub top_leaderboard: RegisterView<Vec<LeaderboardEntry>>, // Top 10 cached leaderboard
    pub is_leaderboard_chain: RegisterView<bool>, // Flag to identify if this is the leaderboard chain
    pub leaderboard_chain_id: RegisterView<Option<ChainId>>, // Store the leaderboard chain ID
    
    // User management fields
    pub users: MapView<String, User>, // username -> User (only on leaderboard chain)
    pub current_user: RegisterView<Option<User>>, // Current logged-in user (on player chains)
    pub login_results: MapView<ChainId, LoginResult>, // Per-chain login results
    
    // Practice mode fields
    // For leaderboard chain:
    pub practice_leaderboard: RegisterView<Vec<PracticeEntry>>, // Top 100 global practice scores
    pub practice_best_scores: MapView<String, PracticeEntry>, // username -> best practice score
    
    // For player chains:
    pub my_practice_scores: RegisterView<Vec<u64>>, // Personal practice score history
    pub my_practice_best: RegisterView<u64>, // Personal best practice score
    
    // Tournament management fields
    // For leaderboard chain:
    pub tournaments: MapView<String, Tournament>, // tournament_id -> Tournament (only on leaderboard chain)
    pub pinned_tournaments: RegisterView<Vec<String>>, // Ordered list of pinned tournament IDs
    pub tournament_counter: RegisterView<u64>, // Counter for generating unique tournament IDs
    pub tournament_leaderboards: MapView<String, Vec<TournamentResult>>, // tournament_id -> live leaderboard
    
    // For player chains:
    pub my_tournaments: RegisterView<Vec<String>>, // Tournament IDs user has joined
    pub my_tournament_scores: MapView<String, Vec<u64>>, // tournament_id -> personal scores in that tournament
}
