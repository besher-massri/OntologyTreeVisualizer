/**
 * Class function to build a tree data structure to be used in d3Tree
 * @param identifier a function to get the id of the items
 * @returns {*} new instance of the class
 */
function TreeBuilder(identifier) {
  if (!identifier) {
    identifier = d => d;
  }
  //object contain id->nodes mapping
  let tree = {};
  let sz = 0;
  //`this` object
  let tb = {};//tree builder
  /**
   * Method for detecting cycles in the graph
   * This method is called before compiling the tree, to ensure the validity of the tree
   * The method is recursive, however for first call, it should be called with: node=rootNode, names={}
   * @param node the current node
   * @param visitedSet: set of the visited nodes until now
   * @returns {boolean}: whether or not the graph contain a cycle
   */
  function cycleDetection(node, visitedSet) {
    if (visitedSet.hasOwnProperty(node.name)) {
      return true;
    }
    let cycle = false;
    visitedSet[node.name] = 1;
    node.children.forEach(function (child) {
      cycle |= cycleDetection(child, visitedSet);
    });
    return cycle;
  }

  /**
   * Method for Creating a node in the tree
   * For each node, the following attributes will be created:
   *  {
   *    name: the identifier of the node
   *    children: list of all children of this node
   *    parent: the parent of the node
   *    data: the data attached with the node, which is initially the object sent as a parameter
   *  }
   * @param node: the data of the node to be created
   *              identifier(node) should give the id of the node
   * @returns {*}: the node object in the tree
   */
  tb.createNode = function (node) {
    let nodeId = identifier(node);
    if (tree.hasOwnProperty(nodeId)) {
      throw 'There is an existing node with the same Id!'
    }
    tree[nodeId] = {
      'children': [],
      'parent': undefined,
      'data': node
    };
    let nodeName=node.name?node.name:node.id;
    tree[nodeId].id=nodeId;
    tree[nodeId].name=nodeName;
    ++sz;
    return tree[nodeId];
  };
  /**
   * Method for adding a child to a certain node
   * If the parent or the child doesn't exist in the tree, they will be created
   * If the child already has a parent, the method will through an error
   * @param parent: the parent node
   *                identifier(node) should give the id of the node
   * @param child: the child node
   *                identifier(node) should give the id of the node
   */
  tb.addChild = function (parent, child) {
    let parentId = identifier(parent);
    let childId=identifier(child);
    let childNode = tb.getNode(childId);
    if (!childNode) {
      childNode = tb.createNode(child);
    }
    if (childNode.parent !== undefined) {
      throw ' node' + childNode.name + ' has a parent!';
    }
    let parentNode = tb.getNode(parentId);
    if (!parentNode) {
      parentNode = tb.createNode(parent);
    }
    childNode.parent = parentId;
    parentNode.children.push(tree[childId]);
  };
  /**
   * Returns a list of all the ids of the nodes in the tree
   * @returns {string[]} list of ids of the nodes in the tree
   */
  tb.getNodesIds=function(){
    return Object.keys(tree);
  };
  /**
   * Get the tree node with the given id
   * @param nodeId: the id of the node to be retrieved
   * @returns $ObjMap|undefined: the node with the given id, or undefined if none exists
   */
  tb.getNode = function (nodeId) {
    return tree[nodeId];
  };
  /**
   * Produce the tree object of the current status of the tree.
   * The format of the tree object is:
   * {
   *      name: nodeName
   *      children:[
   *        {
   *          name: child1Name,
   *          children:[...]
   *        },
   *        {
   *          name:child2Name,
   *          children:[...]
   *        },
   *        ...
   *      ]
   *    }
   *
   * @returns {*} If there is a cycle in the built graph, undefined will be returned.
   *              Otherwise, data object representing the tree DS to be used as the data
   *                 object in the d3tree
   */
  tb.compile = function () {
    let root = {
      name: 'root',
      children: []
    };
    Object.keys(tree).forEach(function (node) {
      if (tree[node].parent === undefined) {
        root.children.push(tree[node]);
      }
    });
    if (cycleDetection(root, {})) {
      return undefined;
    }
    return root;
  };
  /**
   * Clear the tree from all of its nodes
   */
  tb.clear = function () {
    tree = {};
    sz = 0;
  };

  /**
   * Get the number of nodes currently in the tree
   * @returns {number} total number of nodes in a tree
   */
  tb.size = function () {
    return Object.keys(tree).length;
  };
  return tb;
}
module.exports=TreeBuilder;
