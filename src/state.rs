use crate::LeaderboardEntry;
use linera_sdk::linera_base_types::ChainId;
use linera_sdk::views::{linera_views, MapView, RegisterView, RootView, ViewStorageContext};

#[derive(RootView, async_graphql::SimpleObject)]
#[view(context = "ViewStorageContext")]
pub struct FlappyState {
    pub value: RegisterView<u64>,
    pub best: RegisterView<u64>,

    // New fields for leaderboard
    pub player_name: RegisterView<String>,
    pub player_scores: MapView<String, LeaderboardEntry>, // For leaderboard chain: all player scores
    pub top_leaderboard: RegisterView<Vec<LeaderboardEntry>>, // Top 10 cached leaderboard
    pub is_leaderboard_chain: RegisterView<bool>, // Flag to identify if this is the leaderboard chain
    pub leaderboard_chain_id: RegisterView<Option<ChainId>>, // Store the leaderboard chain ID
}
