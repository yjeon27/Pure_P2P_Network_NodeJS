const fs = require('fs');

// fetch for the entire tracker; if not found, return an empty array
var getAllPairs = () => {
    try{
        var pairsString = fs.readFileSync("../peer_tracker.json");
        return JSON.parse(pairsString);
    }catch (e){
        return [];
    }
}

var savePair = (pair) => {
    fs.writeFileSync("../peer_tracker.json", JSON.stringify(pair))
}


var addPeer = (ranPort, folderName, imgPort) => {

    // if empty => []
    // if not => [{peerNum: 1, portNum: 1234}, {peerNum: 2, portNum: 2345}...]
    var pairs = getAllPairs();

    // JSON structure holding pairs of peer number (p1,p2, p3 etc.) and random port numbers
    var pair = {
        "peerNum": 0,
        "portNum": 0,
        "imgNum": 0
    }

    var duplicatePair = pairs.filter((pair) => pair.portNum === ranPort);
    // var duplicatePair1 = pairs.filter((pair) => pair.peerNum === parseInt((folderName.charAt(1)), 10));

    if (isEmpty(duplicatePair)){
        //  if pairs is empty create a peer with it's folder number and matching port number
        if (!pairs.length){
            pair.peerNum = parseInt((folderName.charAt(1)), 10);
            pair.portNum = ranPort;
            pair.imgNum = imgPort;
            pairs.push(pair);
            savePair(pairs);
        }else{
            pair.peerNum = parseInt((folderName.charAt(1)), 10);
            pair.portNum = ranPort;
            pair.imgNum = imgPort;
            pairs.push(pair);
            savePair(pairs);
        }
    }
}

var isEmpty = (obj) => {
    for(var key in obj){
        if (obj.hasOwnProperty(key)){
            return false;
        }
    }
    return true;
}

var getPeer = (ranPort) => {

    var pairs = getAllPairs();
    // console.log('pairs.length = ', pairs.length);
    if (pairs.length){
        // save the pair that matches ranPort into filteredPair
        var filteredPair = pairs.filter((pair) => pair.portNum === ranPort);
        
        return "p"+filteredPair[0].peerNum;
    }else{
        return 0;
    }
}

var getPort = (folderName) => {
    var pairs = getAllPairs();

    if(pairs.length){
        var filteredPair = pairs.filter((pair) => pair.peerNum === parseInt(folderName[1], 10));
        if(isEmpty(filteredPair)){
            return 0;
        }
        return filteredPair[0].portNum;
    }else{
        return 0;
    }
}

var getImgPort = (folderName) => {
    var pairs = getAllPairs();

    if(pairs.length){
        var filteredPair = pairs.filter((pair) => pair.peerNum === parseInt(folderName[1], 10));
        if(isEmpty(filteredPair)){
            return 0;
        }
        return filteredPair[0].imgNum;
    }else{
        return 0;
    }
}

module.exports = {
    addPeer,
    getPeer,
    getAllPairs,
    getPort,
    getImgPort
};