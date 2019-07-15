/**
 * Class function for generating d3 tree visualization for visualizing hierarchical data structures
 * Use TreeBuilder for building the hierarchy tree in the suitable format for this visualization
 * This visualization uses d3.tree and d3.hierarchy which are both methods in d3.js library
 * Example usage of this visualization:
 * <code>
 let d3tree = d3Tree()
 .height(2000)
 .width(1500)
 .data(data)
 .on('nodeOver', nodeOver)
 .on('nodeOut', mouseout);
 d3.select('#svg-div').call(d3tree);
 * </code>
 * @returns {function(*): void}: new instance of the tree
 */
function d3Tree() {
  /*
  data specifications:
   */
  let dimensions = {width: 1000, height: 1000},
    margin = {top: 20, right: 90, bottom: 30, left: 90},
    binding = {
      o: undefined, d: [], f: undefined
    };

  let treeMap;
  let root;
  //data parameters
  let events = {};

  // for tracking click vs dbl click events.
  let clicks = 0, timer = null, duration = 750;

  // nodeId counter
  let i = 0;

  /**
   * Method for adding a margin to dimensions and svg element
   */
  function initMargins() {
    //change the width and width to accommodate for the margins
    dimensions.width -= margin.left - margin.right;
    dimensions.height -= margin.top - margin.bottom;
    // moves the 'group' element to the top left margin
    binding.o = binding.o.attr("transform", "translate(" + [margin.left, margin.top] + ")");
  }

  /**
   * Construct the tree visualization under the given selection
   * This Method should be called with d3 selection representing
   *  the canvas item where the tree should be generated.
   * All the properties of the tree must be specified before calling this method,
   *  Otherwise, they won't have effect
   *
   * @param selection: d3.selection of the canvas object to generate the tree within it
   */
  function chart(selection) {
    // append the svg object to the selection
    // appends a 'group' element to 'svg'
    binding.o = selection.append("svg")
      .attr('height', dimensions.height)
      .attr('width', dimensions.width)
      .append("g");

    treeMap = d3.tree();
    // Assigns parent, children, height, depth
    root = d3.hierarchy(binding.d, function (d) {
      return d.children;
    });
    root.x0 = dimensions.height / 2;
    root.y0 = 0;
    treeMap = treeMap.size([dimensions.width, dimensions.height]);
    initMargins();
    // Collapse after the second level
    root.children.forEach(collapse);

    return chart.update(root);
  }

  /**
   * Method for handling the nodeOut event.
   * It calls the attached nodeOut event from the user
   * @param d: the svg element representing the node where the mouseOut event happened
   */
  function nodeOut(d) {
    if (events.nodeOut) {
      events.nodeOut(d);
    }
  }

  /**
   * Method for handling the nodeOver event.
   * It calls the attached nodeOver event from the user
   * @param d: the svg element representing the node where the mouseOver event happened
   */
  function nodeOver(d) {
    if (events.nodeOver) {
      events.nodeOver(d);
    }
  }

  /**
   * Method for collapsing a node and all of its children
   * @param d: the root node to be collapsed
   */
  function collapse(d) {
    if (d.children) {
      d._children = d.children;
      d._children.forEach(collapse);
      d.children = null
    }
  }

  /**
   * Method for handling the click event.
   * It expand/collapse the immediate children of the clicked node
   * It calls the attached handling event from the user
   * @param d: the svg element representing the node where the click event happened
   */
  function click(d) {
    clicks++;  //count clicks
    if (clicks === 1) {
      timer = setTimeout(function () {
        //  alert("Single Click");  //perform single-click action
        clicks = 0;             //after action performed, reset counter
        if (d.children) {
          d._children = d.children;
          d.children = null;
        } else {
          d.children = d._children;
          d._children = null;
        }
        chart.update(d);
      }, 400);
    } else {
      clearTimeout(timer);    //prevent single-click action
      //  alert("Double Click");  //perform double-click action
      clicks = 0;
      //after action performed, reset counter
      if (d.children) {// turn off all
        dblclick(d, false);
      } else {
        dblclick(d, true); // turn on all
      }
      chart.update(d);
    }
    if (events.nodeClick) {
      events.nodeClick(d);
    }
  }

  /**
   * Method for handling the click event.
   * It expand/collapse all the descending children of the clicked node
   * It calls the attached handling event from the user
   * @param d: the svg element representing the node where the click event happened
   * @param state: boolean: represent the intended state of the node where true=>expand, false=>collapse
   */
  function dblclick(d, state) {
    if (d.children && state === false) {
      d._children = d.children;
      d.children = null;
    } else if (d._children && state === true) {
      d.children = d._children;
      d._children = null;
    }
    if (d._children) {
      d._children.forEach(function (child) {
        dblclick(child, state);
      });
    }
    if (d.children) {
      d.children.forEach(function (child) {
        dblclick(child, state);
      });
    }
    if (events.nodeDbClick) {
      events.nodeDbClick(d);
    }
  }

  /**
   * Method for updating the tree graph.
   * The method is called in the beginning after initiating the tree, and after each action of the tree.
   * This method is responsible for adding/removing/repositioning nodes after expanding/collapsing each node
   * @param source: the node where the action happen, in case of initialization, it should be called with `root`
   */
  chart.update = function (source) {
    // Assigns the x and y position for the nodes
    var treeData = treeMap(root);

    // Compute the new tree layout.
    var nodes = treeData.descendants(),
      links = treeData.descendants().slice(1);

    // Normalize for fixed-depth.
    nodes.forEach(function (d) {
      d.y = d.depth * 180
    });

    // ****************** Nodes section ***************************

    // Update the nodes...

    if (!binding.f) {
      binding.f = function (d) {
        return d.id || (d.id = ++i);
      }
    }
    let node = binding.o.selectAll("g.node")
      .data(nodes, binding.f);

    // Enter any new modes at the parent's previous position.
    var nodeEnter = node.enter().append('g')
      .attr('class', 'node')
      .attr("transform", function (d) {
        return "translate(" + source.y0 + "," + source.x0 + ")";
      })
      .on('click', click)
      .on('mouseover', nodeOver)
      .on('mouseout', nodeOut);

    // Add Circle for the nodes
    nodeEnter.append('circle')
      .attr('class', 'node')
      .attr('r', 1e-6)
      .style("fill", function (d) {
        return d._children ? "lightsteelblue" : "#fff";
      })
      .style('stroke', function (d) {
        return "green";
      });

    // Add labels for the nodes
    nodeEnter.append('text')
      .attr("dy", ".35em")
      .attr("x", function (d) {
        return d.children || d._children ? -13 : 13;
      })
      .attr("text-anchor", function (d) {
        return d.children || d._children ? "end" : "start";
      })
      .text(function (d) {
        return d.data.name;
      });
    // UPDATE
    var nodeUpdate = nodeEnter.merge(node);

    // Transition to the proper position for the node
    nodeUpdate.transition()
      .duration(duration)
      .attr("transform", function (d) {
        return "translate(" + d.y + "," + d.x + ")";
      });

    // Update the node attributes and style
    nodeUpdate.select('circle.node')
      .attr('r', 10)
      .style("fill", function (d) {
        return d._children ? "lightsteelblue" : "#fff";
      })
      .attr('cursor', 'pointer')
      .style('stroke', function (d) {
        return "green";
      });


    // Remove any exiting nodes
    var nodeExit = node.exit().transition()
      .duration(duration)
      .attr("transform", function (d) {
        return "translate(" + source.y + "," + source.x + ")";
      })
      .remove();

    // On exit reduce the node circles size to 0
    nodeExit.select('circle')
      .attr('r', 1e-6);

    // On exit reduce the opacity of text labels
    nodeExit.select('text')
      .style('fill-opacity', 1e-6);

    // ****************** links section ***************************

    // Update the links...
    var link = binding.o.selectAll('path.link')
      .data(links, function (d) {
        return d.id;
      });

    // Enter any new links at the parent's previous position.
    var linkEnter = link.enter().insert('path', "g")
      .attr("class", "link")
      .attr('d', function (d) {
        var o = {x: source.x0, y: source.y0};
        return diagonal(o, o)
      });

    // UPDATE
    var linkUpdate = linkEnter.merge(link);

    // Transition back to the parent element position
    linkUpdate.transition()
      .duration(duration)
      .attr('d', function (d) {
        return diagonal(d, d.parent)
      });

    // Remove any exiting links
    var linkExit = link.exit().transition()
      .duration(duration)
      .attr('d', function (d) {
        var o = {x: source.x, y: source.y};
        return diagonal(o, o)
      })
      .remove();

    // Store the old positions for transition.
    nodes.forEach(function (d) {
      d.x0 = d.x;
      d.y0 = d.y;
    });

    // Creates a curved (diagonal) path from parent to the child nodes
    function diagonal(s, d) {
      return `M ${s.y} ${s.x}
            C ${(s.y + d.y) / 2} ${s.x},
              ${(s.y + d.y) / 2} ${d.x},
              ${d.y} ${d.x}`;
    }
  };
  /**
   * Method for setting the width of the svg in which the tree resides
   * If the tree has already a width value, the value is overwritten
   * @param value: the width of the svg
   * @returns If the value is undefined, the current width is returned.
   *          Otherwise, `this` is returned
   */
  chart.width = function (value) {
    return arguments.length ? (dimensions.width = value, chart) : dimensions.width;
  };
  /**
   * Method for setting the margin of the svg in which the tree resides
   * If the tree has already a margin value, the value is overwritten
   * margin should be an object with the following format:
   *  {left:leftMargin,right:rightMargin,top:topMargin,bottom:bottomMargin}
   * @param value: the margin of the svg
   * @returns If the value is undefined, the current margin is returned.
   *          Otherwise, `this` is returned
   */
  chart.margin = function (value) {
    return arguments.length ? (margin = value, chart) : margin;
  };
  /**
   * Method for setting the height of the svg in which the tree resides
   * If the tree has already a height value, the value is overwritten
   * @param value: the height of the svg
   * @returns If the value is undefined, the current height is returned.
   *          Otherwise, `this` is returned
   */
  chart.height = function (value) {
    return arguments.length ? (dimensions.height = value, chart) : dimensions.height;
  };
  /**
   * Method for setting the data for the tree structure, with an option to assign a special binding function
   * If the tree has already a data or a binding function, the value is overwritten
   * The data should have the following format:
   *    {
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
   * @param data: the tree data structure of the data
   * @param bindingFunction: a method that is called with each item of the data to get the id of the data.
   *           The id is used to match data with svg items.
   *           If no binding function is provided, `id` attribute will be used, or created if doesn't exist
   *
   * @returns $ObjMap|function(*)->void: If <data> is undefined, the current height is returned.
   *          Otherwise, `this` is returned
   */
  chart.data = function (data, bindingFunction) {
    if (arguments.length) {
      binding.d = data;
      if (arguments.length > 1) {
        binding.f = bindingFunction;
      }
      return chart;
    }
    return binding.d;
  };
  /**
   * Method for adding actions on certain events.
   * The current methods available are:
   *  nodeClick: representing a click event on a node
   *  nodeDbClick: representing a double click event on a node
   *  nodeOver: represent a mouse over a node event
   *  nodeOut: represent a mouse out of a node event
   * In all events, the  function is called with the svg element representing the node.
   * The data of the node can be accessed through `data` attribute of the node
   *
   * If the second parameter is undefined, the existing action for that event is returned.
   *
   * @param event: string: the name of the event to attach an the action function on
   * @param callback: fn(node)->void: the function to be called when the action occur
   * @returns: function(*)->void: if <callback> parameter is undefined, the existing action on that event is returned
   *            Otherwise, `this` is returned
   */
  chart.on = function (event, callback) {
    switch (event) {
      case "nodeClick":
        return arguments.length > 1 ? (events.nodeClick = callback, chart) : events.nodeClick;
      case "nodeDbClick":
        return arguments.length > 1 ? (events.nodeDbClick = callback, chart) : events.nodeDbClick;
      case "nodeOver":
        return arguments.length > 1 ? (events.nodeOver = callback, chart) : events.nodeOver;
      case "nodeOut":
        return arguments.length > 1 ? (events.nodeOut = callback, chart) : events.nodeOut;
    }
    return chart;
  };
  return chart;
}


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
      'name': nodeId,
      'children': [],
      'parent': undefined,
      'data': node
    };
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
    let childNode = tb.getNode(child);
    if (!childNode) {
      childNode = tb.createNode(child);
    }
    if (childNode.parent !== undefined) {
      throw ' node' + childNode.name + ' has a parent!';
    }
    let parentNode = tb.getNode(parent);
    if (!parentNode) {
      parentNode = tb.createNode(parent);
    }
    childNode.parent = parentId;
    parentNode.children.push(tree[child]);
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


