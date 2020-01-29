var sendPacket = require('./sendPacket');
let fs = require('fs');
const SmartBuffer = require('smart-buffer').SmartBuffer;
var ITPpacket = require('./ITPpacketResponse');
var net = require('net');
let singleton = require('./Singleton');

var nickNames = {},
    clientIP = {},
    startTimestamp = {};

module.exports = {

    handleImgQuery: function (sock) {
        assignClientName(sock, nickNames);
        const chunks = [];
        sock.on('data', function (requestPacket) {
            handleClientRequests(requestPacket, sock); //read client requests and respond
        });
        sock.on('close', function () {
            handleClientLeaving(sock);
        });
    },

    //                            (sock, msgType, peerS.address(), peerTable.length, peerTable, folderName)
    handleClientJoining: function (sock, msgType, addrport, peerTable, folderName) {  
        // console.log('\nConnected from peer ', sock.remoteAddress, ':', sock.remotePort);

        sock.on('data', readRespond);

        // "data" holds return value of 'createRequestPacket(ver, maxP)' from 'requestPacket.js'
        function readRespond(data) {
            var reader = SmartBuffer.fromBuffer(data);
            requestVersion = reader.readUInt32LE();
                // console.log("Requested version: ", requestVersion);
            requestMaxPeers = reader.readUInt8();
                // console.log("Requested max number of peers: ", requestMaxPeers);
            ranPort = reader.readUInt32LE();
                // console.log('Peer is connected to other peer port: ', ranPort);

            if(msgType == 1){
                console.log('\nConnected from peer ', sock.remoteAddress, ':', ranPort);
                
                peerTable.push(ranPort);
    
                console.log('peerTable now has ', peerTable.length, 'peer(s) stored');
                for(let i=0; i<peerTable.length; i++){
                    console.log('peerTable[',i,']: ', peerTable[i]);
                }
                // console.log('peerTable[0]: ', peerTable[0]);
                // console.log('peerTable[1]: ', peerTable[1]);
    
                // if (peerTable.length == 2){
                //     connectedPeers = peerTable[0];
                // }

                sendPacket.init(data, msgType, addrport, peerTable.length, peerTable, folderName);
    
                //  return the fully formulated ITP packet back to the Client
                sock.write(sendPacket.getPacket());
            }

            else if(msgType == 2){
                console.log('Peer table full: 127.0.0.1:', ranPort, 'redirected');

                sendPacket.init(data, msgType, addrport, peerTable.length, peerTable, folderName);

                //  return the fully formulated ITP packet back to the Client
                sock.write(sendPacket.getPacket());
            }
        };

        sock.on('close', function(data) {
            console.log('CLOSED');
        });

        //  error handling
        sock.on('error', function(err){
            console.log("Socket error: ", err.message);
        });
    }
};


function assignClientName(sock, nickNames) {
    sock.id = sock.remoteAddress + ':' + sock.remotePort;
    startTimestamp[sock.id] = singleton.getTimestamp();
    var name = 'Client-' + startTimestamp[sock.id];
    nickNames[sock.id] = name;
    clientIP[sock.id] = sock.remoteAddress;
}

function handleClientRequests(data, sock) {
    let imageFilename = bytes2string(data.slice(4));
    console.log('inside handleClientRequests...');
    console.log('requested image name: ', imageFilename);
    fs.readFile('images/' + imageFilename, (err, data) => {
        if (!err) {
            var infile = fs.createReadStream('images/' + imageFilename);
            const imageChunks = [];
            infile.on('data', function (chunk) {
                imageChunks.push(chunk);
            });

            infile.on('close', function () {
                console.log('CURRENT BUFFER: ');
                let image = Buffer.concat(imageChunks);
                console.log('CONCATONATED IMAGE: ', image);
                ITPpacket.init(1, singleton.getSequenceNumber(), singleton.getTimestamp(), image, image.length);
                sock.write(ITPpacket.getPacket());
                sock.end();
            });
        } else {
            console.log('readfile error');
        }
    });
}

function handleClientLeaving(sock) {
    console.log(nickNames[sock.id] + ' closed the connection');
}

function bytes2string(array) {
    var result = "";
    for (var i = 0; i < array.length; ++i) {
        result += (String.fromCharCode(array[i]));
    }
    return result;
}

function bytes2number(array) {
    var result = "";
    for (var i = 0; i < array.length; ++i) {
        result ^= array[array.length-i-1] << 8*i ;
    }
    return result;
}