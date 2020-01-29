let fs = require('fs');
let net = require('net'),
    singleton = require('./Singleton'),
    tracker = require('./peer_tracker');
    handler = require('./ClientsHandler');
    random_port =  require('random-port');
const _ = require("lodash");
const argv = require('yargs').argv;
const SmartBuffer = require('smart-buffer').SmartBuffer;
var requestPacket = require('./requestPacket');
var path = require('path');


let HOST = '127.0.0.1';
// let peerC = new net.Socket();       // client-side
let peerS = net.createServer();     // server-side
let addr = "0";
let port = 0;
let peerTable = [];

const p = argv.p;
let n = argv.n;   // default maxpeers = 6
if(typeof(n) === typeof(1)){
    if(n <= 0){
        console.log('Maximum peers should be greater than 0.');
        console.log('...defaulted to 6.');
        n = 6;
    }
}else{
    console.log('Incorrect input. Maximum peers have been defaulted to 6!');
    n = 6;
}
const v = argv.v;   // version = 3314

var reader;
var temp, ranPort;
var folderName = path.basename(__dirname);

net.bytesWritten = 300000;
net.bufferSize = 300000;

//  initialize timer
singleton.init();

// check for no flags "-p" "-v" and return boolean
function noFlags(){
    return (typeof(p) == typeof(v));
}


//  only split when p flag is set
if (typeof(p) !== 'undefined'){
    //  host address
    addr = p.split(":")[0];
    //  port
    port = parseInt(p.split(":")[1], 10);
}

console.log('Folder Name: ', folderName);

//  see if peer_tracker.json already holds the peer#/port# pair
ranPort = tracker.getPort(folderName);
if (ranPort == 0){
    //  try-catch to see & see if ranPort can stay the same as the value used previously
    try{
        var t = fs.readFileSync("./keep_port.txt");
        temp = parseInt(t, 10);
    }catch(e){
        temp = "string";
    }
    //  if the logged file does not exist, create a brand new random port (first time running commands)
    if(isNaN(temp)){
        // 0-1023 is usually reserved so create random port # from 1024 ~ 65535
        ranPort = Math.floor(Math.random() * (65535 - 1024)) + 1024;
        console.log('creating random port');
    }else{
        ranPort = temp;
        console.log('keeping same port');
    }   
}

console.log('Random Port = ', ranPort);

var startClient = (_p) => {
    let peerC = new net.Socket();       // client-side
    console.log('=============================================================');
    console.log('STARTING CLIENT - _p: ', _p);
    if (typeof(_p) == 'undefined'){
        _p = port;
        console.log('_p is now: ', port);
    }
    //  No defined flags mean the new node is simply listening to its port with no connected peers
    if(noFlags()){
        console.log('___________________________');
        console.log('Max Number of Peers set to: ', n);
        console.log('___________________________');

        //  check if there are preexisting peers
        if (tracker.getAllPairs().length){
            console.log("This node is not the first but isn't connected to any peers!");
            tracker.addPeer(ranPort, folderName);
        }else{
            console.log('Creating the first peer!');
            tracker.addPeer(ranPort, folderName);  // first ever peer created
        }

        console.log('This peer address is ', HOST, ':', ranPort, 'located at ', folderName);

        //  deal with client part of peer(s) connecting to designated port
        peerS.on('connection', function(sock) {
            // PeerTable now holds (port number & ip address)
            if (peerTable.length < n){
                handler.handleClientJoining(sock, 1, peerS.address(), peerTable, folderName);
                console.log('handler finished ... peerTable: ', peerTable);
            }else{
                console.log('\n\npeerTable is full with ', peerTable.length, 'peers connected!');
                handler.handleClientJoining(sock, 2, peerS.address(), peerTable, folderName);
                console.log('handler finished... peerTable: ', peerTable);
            }
        });

    }else{
        console.log('___________________________');
        console.log('flags have been set');
        console.log('___________________________');

        console.log('_p: ', _p);
        console.log('addr: ', addr);
        console.log('\n\n');

        peerC.on('end', function(){
            console.log('end fn');
        })

        peerC.on('error', function(err){
            console.log('Error occured here with msg: ', err);
        })

        peerC.on('connect', function(){
            requestPacket.init(argv.v, argv.n, ranPort);

            tracker.addPeer(ranPort, folderName);
            peerTable.push(_p);
            console.log('Connected to peer ', tracker.getPeer(_p), ':' + _p, 'at timestamp: ', singleton.getTimestamp());
        
            //  send request packet over the socket to "ClientsHandler.js"
            peerC.write(requestPacket.getpacket());
        })

        peerC.connect(_p, addr);

        //  HANDLE INCOMING DATA FROM THE SERVER SIDE OF PEER
        peerC.on('data', function(data){
            reader = SmartBuffer.fromBuffer(data);
            let ver = reader.readUInt32LE(),
                mType = reader.readUInt8(),
                addr = reader.readStringNT(),   // addrport.address
                por = reader.readUInt32LE();    // addrport.port
                peerNum = reader.readUInt8();
            let reserved =[], peerPort = [], peerAdd = [];
                for (let i = 0; i < peerNum; i++){
                    reserved[i] = reader.readStringNT(),
                    peerPort[i] = reader.readStringNT(),
                    peerAdd[i] = reader.readStringNT();
                }
                serverName = reader.readStringNT();

            let trackerPort = serverName+":"+por;

            if (mType == 1){
                console.log(`
                    ---------------------------------------------------------------------
                    V = ${ver}                  Message Type = ${mType}
                                Sender = ${addr}:${por}
                                Number of Peers = ${peerNum}`);
                for(let i = 0; i < peerNum; i++){
                console.log(`
                    Reserved = ${reserved[i]}      Peer Port Number = ${peerPort[i]}
                            Peer IPv4 Address = ${peerAdd[i]}`);
                }
                console.log(`
                    ---------------------------------------------------------------------
                    
                    This peer address is ${peerS.address().address}:${peerS.address().port} located at ${folderName}
                    Received ack from ${trackerPort}`);
                for (let i = 0; i < peerNum; i++){
                    console.log(`
                        which is peered with: 127.0.0.1:`,peerPort[i]);
                }
                console.log('\n\n');
            }else if (mType == 2){
                console.log('Join redirected, try to connect to the peer above.');

                // close current connection that ended unsuccessfully
                peerC.destroy();

                fs.writeFileSync("./keep_port.txt", peerS.address().port);
                console.log('creating keep_port.txt\n\n');
                console.log('================================================...');
                //  remove previously 'connected' peer from peerTable as connection was unsuccessful
                const updated = peerTable.filter(function(pNum){
                    return pNum != port;
                })
                peerTable = updated;

                //  try connecting to the list of peers that have been returned from rejected server
                for (let i = 0; i < peerNum; i++){
                    //  if current peer's peerTable is at maximum, exit out of for loop
                    if(peerTable.length == n){
                        console.log('maximum peer number reached...');
                        break;
                    }
                    console.log('attempting to connect to ',peerPort[i],' ...');

                    // check to see if I am already connected to the same peer
                    if(peerTable.includes(peerPort[i])){
                        console.log('Already connected to ',peerPort[i]);
                    }else{
                        console.log('peerPort: ', peerPort);
                        startClient(parseInt(peerPort[i],10))
                    }
                }
            }
        });

        peerC.on('close', function(){
            console.log('socket is closed');
        });


        //  deal with incoming connection as a server after it starts out as a client
        peerS.on('connection', function(sock) {
            // accept connection if there is space left based on previously defined maxPeer number
            if (peerTable.length < n){
                handler.handleClientJoining(sock, 1, peerS.address(), peerTable, folderName);
                console.log('handler finished... peerTable: ', peerTable);
            }else{
                console.log('\n\npeerTable is full with ', peerTable.length, 'peers connected!');
                handler.handleClientJoining(sock, 2, peerS.address(), peerTable, folderName);
                console.log('handler finished... peerTable: ', peerTable);
            }
        });
    }
    peerS.listen(ranPort, HOST);
}

startClient();