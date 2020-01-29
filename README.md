# Pure_P2P_Network_NodeJS
## Implementing a pure peer-to-peer network using NodeJS
- image querying function amongst connected peers
  - peer looks for queried image within local directory and sends them via buffer
- peer tracker that keeps track of the connected peers' ip:portNum
- User can define the maximum number of peers it can connect to; if undefined - defaults to 6
### Scenario (Refer to pictures in `FLOW_OF_PROGRAM`):
- 4 peers
- Connects to each other in chronological order, while querying for images that some peers have; some don't


### Test It Yourself!
1. Clone repo
2. Copy the directory 4 times in separate directories to simulate 4 *different peers*
3. Install the node dependencies by typing in
  - cmd > `node install`
4. Remove different images from different directories to test out image querying
5. Follow commands shown in `FLOW_OF_PROGRAM`
