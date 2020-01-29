let handler = require('./ClientsHandler');
let singleton = require('./Singleton');
const fs = require("fs");
const SmartBuffer = require('smart-buffer').SmartBuffer;
var reader, pckt;

var requestVersion, requestMaxPeers, ranPort;



function createResponsePacket(requestVersion, msgType, addrport, peerNum, peerTable, folderName){
    const packet = new SmartBuffer();

    //  4 bytes for version (3314)
    packet.writeUInt32LE(requestVersion);
        // console.log('\nwrote requestVersion');
    //  1 byte for message type (1 or 2)
    packet.writeUInt8(msgType);
        // console.log('wrote msgType');
    //  server's ip/port
    packet.writeStringNT(addrport.address);
        // console.log('wrote addrport.address');
    packet.writeUInt32LE(addrport.port);
        // console.log('wrote addrport.port');
    //  connected number of peers
    packet.writeUInt8(peerNum);
        // console.log('wrote peerNum');
    
    for(let i = 0; i < peerNum; i++){
        //  reserved
        packet.writeStringNT("00");
            // console.log('wrote reserved');
        //  connected peer's PORT
        packet.writeStringNT(peerTable[i].toString(10));
        //  connected peer's IP
        packet.writeStringNT("127.0.0.1");
            // console.log('wrote peerAddress');
    }
        
    packet.writeStringNT(folderName);
        // console.log('wrote server's folderName');

    return packet.toBuffer();
}

module.exports = {
    //            (sock, msgType, peerS.address(), peerTable.length, peerTable, folderName)
    init: function(data, msgType, addrport, peerNum, peerTable, folderName) {

        pckt = createResponsePacket(3314, msgType, addrport, peerNum, peerTable, folderName);
    },

    //--------------------------
    //getlength: return the total length of the ITP packet
    //--------------------------
    getLength: function() {
        return pckt.remaining();
    },

    //--------------------------
    //getpacket: returns the entire packet
    //--------------------------
    getPacket: function() {
        return pckt;
    }
};