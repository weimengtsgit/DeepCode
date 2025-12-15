# DeepCode Lab - Paper Reproduction

This project implements the algorithms and experiments from the paper "Deep Reinforcement Learning that Matters" by Harris et al.

## Project Structure
- `algorithms/`: Implementation of reinforcement learning algorithms (PPO, A2C, ACKTR, TRPO)
- `environments/`: Custom environment implementations and wrappers
- `experiments/`: Experiment configurations and runners
- `utils/`: Utility functions for training, evaluation, and plotting

## Getting Started

### Installation
```bash
pip install -r requirements.txt
```

### Running Experiments
```bash
# Run PPO experiment
python experiments/run_ppo.py --env-name "CartPole-v1"

# Run A2C experiment
python experiments/run_a2c.py --env-name "CartPole-v1"
```

## Algorithms Implemented
- Proximal Policy Optimization (PPO)
- Advantage Actor-Critic (A2C)
- Actor-Critic using Kronecker-factored Trust Region (ACKTR)
- Trust Region Policy Optimization (TRPO)

## References
- Harris et al. "Deep Reinforcement Learning that Matters"