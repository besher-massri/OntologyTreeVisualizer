function DistanceMatrix() {
  let distanceMatrix = {};
  let graph = {};
  let identifier = d => d;
  let sz = 0;
  /**
   * Method for Creating a node in the graph
   * For each node, the following attributes will be created:
   *  {
   *    name: the identifier of the node
   *    neighbors: list of all neighbors of this node
   *    data: the data attached with the node, which is initially the object sent as a parameter
   *  }
   * @param node: the data of the node to be created
   *              identifier(node) should give the id of the node
   * @returns {*}: the node object in the graph
   */
  distanceMatrix.createNode = function (node) {
    let nodeId = identifier(node);
    if (graph.hasOwnProperty(nodeId)) {
      throw 'There is an existing node with the same Id!'
    }
    graph[nodeId] = {
      'name': nodeId,
      'neighbors': {},
      'data': node
    };
    ++sz;
    return graph[nodeId];
  };

  /**
   * Returns a list of all the ids of the nodes in the graph
   * @returns {string[]} list of ids of the nodes in the graph
   */
  distanceMatrix.getNodesIds = function () {
    return Object.keys(graph);
  };
  /**
   * Get the graph node with the given id
   * @param nodeId: the id of the node to be retrieved
   * @returns $ObjMap|undefined: the node with the given id, or undefined if none exists
   */
  distanceMatrix.getNode = function (nodeId) {
    return graph[nodeId];
  };
  /**
   * Clear the graph from all of its nodes
   */
  distanceMatrix.clear = function () {
    graph = {};
    sz = 0;
  };

  /**
   * Get the number of nodes currently in the graph
   * @returns {number} total number of nodes in a graph
   */
  distanceMatrix.size = function () {
    return Object.keys(graph).length;
  };
  distanceMatrix.addEdge = function (first, second) {

    let firstNode = distanceMatrix.getNode(first);
    if (!firstNode) {
      firstNode = distanceMatrix.createNode(first);
    }
    let secondNode = distanceMatrix.getNode(second);
    if (!secondNode) {
      secondNode = distanceMatrix.createNode(second);
    }
    if (!firstNode.neighbors[second]){
      firstNode.neighbors[second]=0;
    }
    if (!secondNode.neighbors[first]){
      secondNode.neighbors[first]=0;
    }
    firstNode.neighbors[second] += 1;
    secondNode.neighbors[first] += 1;
  };
  distanceMatrix.compile = function () {
    let self=this;
    let distanceMatrix = [];
    const INF = 100000009;
    let ids = self.getNodesIds();
    for (let i = 0; i < ids.length; ++i) {
      distanceMatrix.push([]);
      for (let j = 0; j < ids.length; ++j) {
        distanceMatrix[i].push(INF);
      }
    }

    ids.forEach((cur, idx) => {
      let node = self.getNode(cur);
      Object.keys(node.neighbors).forEach(otherId => {
        let otherIdx = ids.indexOf(otherId);
        if (otherIdx === -1) {
          throw "id is not found";
        }
        let value = node.neighbors[otherId];
        distanceMatrix[idx][otherIdx] = value;
      })
    });
    for (let i = 0; i < ids.length; ++i) {
      for (let j = 0; j < ids.length; ++j) {
        for (let u = 0; u < ids.length; ++u) {
          distanceMatrix[i][j] = Math.min(distanceMatrix[i][j], distanceMatrix[i][u] + distanceMatrix[u][j]);
        }
      }
    }
    distanceMatrix.forEach(cur=>{
      cur.forEach((field,idx)=>{
        if (field===INF){
          cur[idx]=-1;
        }
      })
    });
    console.log("Calculated distance matrix");
    return {
      nodes: ids,
      distanceMatrix: distanceMatrix
    };
  };
  distanceMatrix.identifier = function (value) {
    return arguments.length ? (identifier = value, distanceMatrix) : identifier;
  };

  return distanceMatrix;
}

module.exports = DistanceMatrix;
