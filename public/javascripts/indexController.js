/**
 * This is the main module of the program
 * First, it loads the data.
 * Then use dataProcessing module to process the data
 * Finally it uses d3Tree module to generate the tree visualization
 * It has also some methods for displaying extra information about the selected terms
 */

/**
 * Method for handling the mouseout event of a node in the tree
 * it removed the information of the previously selected term
 *
 * @param d: the node where the mouseout event occurred
 */

function nodeOut(d) {
  d3.select('#name').text('Definition');
  d3.select('#topics-div').selectAll('*').remove();
  d3.select('#syn-div').selectAll('*').remove();
}

/**
 * Method for handling the mouseover event of a node in the tree
 * it displays:
 *    1- the name of the term
 *    2- a list of its topics
 *    3- a list of its synonyms
 *
 * @param d: the node where the mouseover event occurred
 */
function nodeOver(d) {
  let info = d.data.data;
  if (info) {
    d3.select('#name').text(info.Term);
    let topicsDiv = d3.select('#topics-div');
    topicsDiv.selectAll('*').remove();
    info.topics.forEach(cur=>{
      topicsDiv.append('li')
        .text(cur)
        .attr('class', 'list-group-item');
    });
    let synonymsDiv = d3.select('#syn-div');
    synonymsDiv.selectAll('*').remove();
    info.alternative_names.forEach(cur=>{
      synonymsDiv.append('li')
        .text(cur)
        .attr('class', 'list-group-item');
    });
  }
}

/**
 * Method for creating the d3tree tree and configure it
 * It uses d3tree class
 *
 * @param data: the data to be displayed in d3tree
 */
function drawTree(data) {
  let d3tree = d3Tree()
    .height(2000)
    .width(1100)
    .data(data)
    .on('nodeOver', nodeOver)
    .on('nodeOut', nodeOut);
  d3.select('#svg-div').call(d3tree);
}


//Starting point of the program

let tree = {};
let processedTree = {};
d3.json('/get-tree', function (ontology) {
  d3.json('/get-distance-matrix', function (distanceMatrix) {
    //The downloadable ontology will consists of the tree, along with the nodes list
    processedTree = {
      tree: ontology.ontologyTree,
      terms: distanceMatrix.nodes,
      distanceMatrix: distanceMatrix.distanceMatrix
    };
    //visualizing the tree
    drawTree(ontology.ontologyTree);
  });
});

/**
 * Download the ontology data as json file named `ontology`
 */
function downloadTree() {
  console.log(processedTree);
  var blob = new Blob([JSON.stringify(processedTree)], {type: "text/plain;charset=utf-8"});
  saveAs(blob, "ontology.json");
}
