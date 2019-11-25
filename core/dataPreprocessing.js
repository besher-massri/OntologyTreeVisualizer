/**
 * This module is for processing the ontology and definitions dataset
 * It uses d3Tree module to generate the tree visualization out of them
 * The process used here is very dataset specific, and may vary from ontology dataset to another
 * It assumes the existence of two files, one for ontology, which should be in the rdf
 *  format(but converted to json), and another one for the definitions.
 *
 * The ontology dataset will be parsed and the tree structure will be generated out of it
 *
 * Then the definitions will be matched to the ontology terms and add them as supporting data
 *
 * Those definitions will be displayed as additional information when the term is selected
 *
 */
let fs = require('fs');
let Papa = require('papaparse');
let DistanceMatrix = require('./distanceMatrix');
let TreeBuilder = require('./TreeBuilder');

class DataPreprocessing {
  /**
   * Replace all the occurrences of a pattern in a string with another pattern
   * @param find: the pattern to replace
   * @param replace: the other pattern to replace with
   * @returns {string}: the new string with all the ocurrences of <find> are replaced with <replace>
   */
  replaceAll(str, find, replace) {
    let self = this;
    return str.replace(new RegExp(DataPreprocessing.escapeRegExp(find), 'g'), replace);
  };

  /**
   * Method for escaping special characters of the regex
   * It's used when creating regular expressions out of a string
   * @param str: the string to be escaped
   * @returns {void | string}: the new string with all special regex characters escaped
   */
  static escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
  }


  /**
   * Get the term name out of the url
   * The term name is whatever comes after 'http://www.informea.org/terms/' in the url
   *
   * @param url{String}: the url from which the term will be retrieved
   * @returns {String} the term extracted from the url
   */
  getTerm(url) {
    return url.slice('http://www.informea.org/terms/'.length);
  }

  /**
   * Parsing the ontology dataset, and generate the tree structure out of it
   * It uses TreeBuilder class to build the tree structure
   *
   * @param data{*}: the ontology dataset to be parsed
   * @returns {{distanceMatrix: *, tree: *}}: the tree structure of the ontology
   */
  parseOntology(data) {
    let tree = TreeBuilder(d => d.id);
    let distanceMatrix = DistanceMatrix();
    let names = {};
    let self = this;
    data['Description'].forEach(function (term) {
      let id = term['@about'];
      if (!id.startsWith('http://www.informea.org/terms')) {
        throw 'name start with no http' + id;
      }

      let name = self.getTerm(id);
      if (names.hasOwnProperty(name)) {
        return;
        //throw 'repeated name' + name;
      }
      if (!name.startsWith('xl_en') && term.hasOwnProperty('broader') && !names.hasOwnProperty(name)) {
        names[name] = 1;
        let parentId = term['broader']['@resource'];
        let parent = self.getTerm(parentId);
        if (parent === "" || parent === undefined) {
          throw 'Parent name is undefined!';
        }
        tree.addChild({id: parent, uri: parentId}, {id: name, uri: id});
        distanceMatrix.addEdge(parent, name);
      }
    });
    console.log('number of ontology items in the tree', tree.size(), ' out of ', data['Description'].length);
    return {tree, distanceMatrix};
  }

  /**
   * Process the definition name to make it match the terms in the ontology
   * It:
   *  1- Removes special characters
   *  2- replaces spaces with dashes (-)
   *  3- converts to lower case
   *
   * This process is done based on inspecting both definitions and ontology datasets
   * @param name: the name of the definition to be processed
   * @returns {string}: the name after processing
   */
  processName(name) {
    name = this.replaceAll(name, '(', '');
    name = this.replaceAll(name, ')', '');
    name = this.replaceAll(name, ')', '');
    name = this.replaceAll(name, '\'', '');
    name = this.replaceAll(name, '  ', ' ');
    name = this.replaceAll(name, ' ', '-');
    name = name.toLowerCase();
    return name;
  }

  /**
   * Match the definitions with the ontology terms and add them as data to the tree nodes
   *
   * @param tree: {TreeBuilder}: the tree structure of the ontology
   * @param definitions: the definitions to be matched with the ontology
   */
  parseDefintions(tree, definitions) {
    let termWithDefinition = 0;
    let self = this;
    let unique = {};
    definitions.forEach(function (definition) {
      let name = self.processName(definition['Term']);
      if (tree.getNode(name)) {
        let node = tree.getNode(name);
        node.data.topics = [];
        node.data.alternative_names = [];
        node.data.definitions = [];
        for (let i = 1; i <= 4; ++i) {
          if (definition['Topic #' + i] !== "") {
            node.data.topics.push(definition['Topic #' + i]);
          }
        }
        for (let i = 1; i <= 12; ++i) {
          if (definition['Synonym #' + i] !== "") {
            let syn = definition['Synonym #' + i];
            if (syn === name) {
              continue;
            }
            if (!unique.hasOwnProperty(syn)) {
              unique[syn] = 1;
              node.data.alternative_names.push(syn);
            }
          }
        }
        for (let i = 1; i <= 4; ++i) {
          if (definition['Definition #' + i] !== "") {
            node.data.definitions.push(definition['Definition #' + i]);
          }
        }
        node.data.Term = name;
        termWithDefinition++;
      }
    });
    console.log("Total unique names", Object.keys(unique).length);
    Object.keys(unique).forEach(key => {
      if (unique[key].length > 1) {
        console.log("Term: " + key + "\t\t\t\t\t freq: " + unique[key]);
      }
    });
    console.log('number of matched definition', termWithDefinition, ' out of ', definitions.length);
    console.log('total terms with definitions ', termWithDefinition, ' out of ', tree.size());
  }

  /**
   * Main function for processing the ontology and definitions data
   * It first parse the ontology and generate the tree strucutre
   * Then support the terms with additional definition
   * Finally, it compile the tree and return it to be used for d3tree visualization
   *
   * @param ontology: the ontology data on which the tree will be built
   * @param definitions: the definitions that will be used as additional information to the terms
   */
  processData(ontology, definitions) {
    let {tree, distanceMatrix} = this.parseOntology(ontology);
    this.parseDefintions(tree, definitions);
    let treeData = {'ontologyTree': tree.compile(), 'ontologyList': tree.getNodesIds()};
    let disData = distanceMatrix.compile();
    let self = this;
    disData.nodes.forEach((cur, idx) => {
      let node = tree.getNode(cur);
      disData.nodes[idx] = {
        uri: node.data.uri,
        name: self.replaceAll(cur, '-', ' '),
        alternative_names: node.data.alternative_names.map(cur => self.replaceAll(cur, '-', ' ')),
        definitions: node.data.definitions,
        topics: node.data.topics
      }
    });
    return {tree: treeData, distanceMatrix: disData};
  }

  /**
   * Method for loading the ontology and definitions datasets
   * Since the loading is done asyncronously, a callback function must be provided
   *
   */
  async loadData(callback) {
    this.ontology = JSON.parse(fs.readFileSync(__dirname + '/../data/ontology.json', "utf8"));
    let content = fs.readFileSync(__dirname + '/../data/definitions.csv', "utf8");
    this.definitions = (await Papa.parse(content, {
      header: true,
      escapeChar: '\\',
      skipEmptyLines: true,
      encoding: "ISO-8859-3"
    })).data;
    callback();
  }

  constructor() {
    let self = this;
    self.ontology = {};
    self.definitions = [];
    self.tree = {};
    self.distanceMatrix = {};

    self.loadData(function () {
      let {tree, distanceMatrix} = self.processData(self.ontology, self.definitions);
      self.tree = tree;
      self.distanceMatrix = distanceMatrix;
    });
  }

  getTree() {
    return this.tree;
  }

  getDistanceMatrix() {
    return this.distanceMatrix;
  }
}

module.exports = new DataPreprocessing();
