DChat
=====

Node.js chat service based on websockets.

Features
--------

* Operates on both websocket and flashsocket client.
* It starts several chat processes, equal the number of your CPU's.
* All communications between chat instances ore provided via Redis pub/sub.
* Operates with several Redis instances via hashring.
* Provide unlimited number of chat rooms.
* Store message history, delete old messages after the time has passed.
* Provide users-per-room counting.
* Read-only user mode for load reduction.

Load Capabilities
-----------------

Max connection count is limited by ulimit and amount of memory.
Each connection you expect should be provided with 1 MB of RAM.

Max number of clients is also limited by CPU.
Small test on ubuntu VM with 4 CPUS (2.5 GHz Intel Core i5) showed,
that 30.000 is ok. 

Requirements
------------

* Node.js (KO, thank you!)
* Redis

### Node.js modules

* websocket >=1.0.7
* redis >= 0.7.1
* hash_ring >= 0.2.0
* policyfile >= 0.0.5
* mongodb >= 1.1.8 (only for utility purposes)
* underscore >=1.4.1

Be careful!
------------

All redis '*:users_count' collections should be deleted before chat is started 
for correct user counting. 

Suggestions and Feedback
------------------------

We will be very pleased if you'll send us some feedback, suggestions and feature-request.
It surely will help this project to evolve. 