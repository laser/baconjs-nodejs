Seattle Weather Aficionados Signal Graph
-----------------

[merge [single async API call for current weather] [poll for current weather on 2000ms interval]] to create "currentWeather" property

[each inbound socket.IO connection] to create "connections" stream --> [onValue]: send connection-message to previously-connected clients
     |
     |
     +---> [combined with "currentWeather" property] to create "greetings" stream --> [onValue]: send greeting to new user
     |
     |
     +---> [flatMap messages sent by each connection] to create "messages" stream --> [onValue]: "emit" to all clients
                  |
                  |
                  +--> [filter messages containing string] to create "cloudy" stream --> [onValue]: log message to logging server
                  |
                  |
                  +--> [scan into an integer, incrementing w/each message]
                                     |
                                     |
                                     +--> [map to true/false by taking modulo 5 of sum]
                                                  |
                                                  |
                                                  +--> [flatMap to grab a "fact of the day" from database] to create "fact" property
                                                              |
                                                              |
                                                              +--> [onValue]: send fun fact to new users
