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
    for (let i = 1; i <= 4; ++i) {
      if (info['Topic #' + i] !== "") {
        topicsDiv.append('li')
          .text(info['Topic #' + i])
          .attr('class', 'list-group-item');
      }
    }
    let synonymsDiv = d3.select('#syn-div');
    synonymsDiv.selectAll('*').remove();
    for (let i = 1; i <= 12; ++i) {
      if (info['Synonym #' + i] !== "") {
        synonymsDiv.append('li')
          .text(info['Synonym #' + i])
          .attr('class', 'list-group-item');
      }
    }
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


/**
 * Method for loading the ontology and definitions datasets
 * Since the loading is done asyncronously, a callback function must be provided
 *
 * @param callback: The callback function to call with the ontology and definitions once loading is finished
 */
function loadData(callback) {
  /*loading the ontology terms and definitions list*/
  d3.json('../data/ontology.json', function (ontology) {
    d3.csv('../data/definitions.csv', function (definitions) {
      callback(ontology, definitions);
    });
  });
}

//Starting point of the program

let tree = {};

loadData(function (ontology, definitions) {
  //processing data
  tree = processData(ontology, definitions);
  //visualizing the tree
  drawTree(tree);
  //print the final tree structure
  console.log(JSON.stringify(tree));
});

function downloadTree() {
  var blob = new Blob([JSON.stringify(tree)], {type: "text/plain;charset=utf-8"});
  saveAs(blob, "processTree.json");
}
