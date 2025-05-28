use async_graphql::{Request, Response};
use linera_sdk::{
    graphql::GraphQLMutationRoot,
    linera_base_types::{ChainId, ContractAbi, ServiceAbi},
};
use serde::{Deserialize, Serialize};

pub struct FlappyAbi;

impl ContractAbi for FlappyAbi {
    type Operation = Operation;
    type Response = ();
}

impl ServiceAbi for FlappyAbi {
    type Query = Request;
    type QueryResponse = Response;
}

// Application parameters - can be set after deployment
#[derive(Debug, Clone, Deserialize, Serialize, Default)]
pub struct ApplicationParameters {
    pub leaderboard_chain_id: Option<ChainId>,
}

#[derive(Debug, Deserialize, Serialize, GraphQLMutationRoot)]
pub enum Operation {
    Increment {
        value: u64,
    },
    SetBestAndSubmit,
    RequestLeaderboard,
    // Setup operation to configure the game (only works once)
    SetupGame {
        leaderboard_chain_id: ChainId,
        leaderboard_name: String,
    },
}

// Add message types for cross-chain communication
#[derive(Debug, Deserialize, Serialize)]
pub enum FlappyMessage {
    // From player chain to central chain
    SubmitScore {
        player_name: String,
        score: u64,
        chain_id: ChainId,
    },
    // Request leaderboard from central chain
    RequestLeaderboard {
        requester_chain_id: ChainId,
    },
    // Response from central chain
    LeaderboardUpdate {
        entries: Vec<LeaderboardEntry>,
    },
}

// Leaderboard entry structure
#[derive(Debug, Clone, Deserialize, Serialize, async_graphql::SimpleObject)]
pub struct LeaderboardEntry {
    pub player_name: String,
    pub score: u64,
    pub chain_id: ChainId,
    pub timestamp: u64,
}
