ECHO Start of Loop

FOR /L %%i IN (1,1,100) DO (
  ECHO %%i
  start chrome "http://localhost:8082/vibe?blockTime=567&numberOfNeighbours=4&numberOfNodes=20&simulateUntil=1531411943382&transactionSize=1&throughput=105&latency=900&neighboursDiscoveryInterval=3000&maxBlockSize=100&maxBlockWeight=4000&networkBandwidth=1&strategy=BITCOIN_LIKE_BLOCKCHAIN&transactionPropagationDelay=150&hashRate=30&confirmations=6"
  timeout /t 40
)