const SmartBuffer = require('smart-buffer').SmartBuffer;

var pckt;

function createRequestPacket(ver, maxP, ranPort){
    const packet = new SmartBuffer();

    //  "-v 3314"
    packet.writeUInt32LE(ver);     // user input version (3314)
    //  "-n 6"
    packet.writeUInt8(maxP);  
    
    packet.writeUInt32LE(ranPort);

    return packet.toBuffer();
}

module.exports = {


    init: function(ver, maxP, ranPort) {
        pckt = createRequestPacket(ver, maxP, ranPort);
    },

    //--------------------------
    //getpacket: returns the entire packet
    //--------------------------
    getpacket: function() {
        return pckt;
    }

};