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


/**
 * Method for escaping special characters of the regex
 * It's used when creating regular expressions out of a string
 * @param str: the string to be escaped
 * @returns {void | string}: the new string with all special regex characters escaped
 */
function escapeRegExp(str) {
  return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

/**
 * Replace all the occurrences of a pattern in a string with another pattern
 * @param find: the pattern to replace
 * @param replace: the other pattern to replace with
 * @returns {string}: the new string with all the ocurrences of <find> are replaced with <replace>
 */
String.prototype.replaceAll = function (find, replace) {
  return this.replace(new RegExp(escapeRegExp(find), 'g'), replace);
};


/**
 * Get the term name out of the url
 * The term name is whatever comes after 'http://www.informea.org/terms/' in the url
 *
 * @param url{String}: the url from which the term will be retrieved
 * @returns {String} the term extracted from the url
 */
function getTerm(url) {
  return url.slice('http://www.informea.org/terms/'.length);
}

/**
 * Parsing the ontology dataset, and generate the tree structure out of it
 * It uses TreeBuilder class to build the tree structure
 *
 * @param data{*}: the ontology dataset to be parsed
 * @returns {TreeBuilder}: the tree structure of the ontology
 */
function parseOntology(data) {
  let tree = TreeBuilder();
  let names = {};
  data['Description'].forEach(function (term) {
    let name = term['@about'];
    if (!name.startsWith('http://www.informea.org/terms')) {
      throw 'name start with no http' + name;
    }
    name = getTerm(name);
    if (names.hasOwnProperty(name)) {
      return;
      //throw 'repeated name' + name;
    }
    if (!name.startsWith('xl_en') && term.hasOwnProperty('broader') && !names.hasOwnProperty(name)) {
      names[name] = 1;
      parent = getTerm(term['broader']['@resource']);
      if (parent === "" || parent === undefined) {
        throw 'Parent name is undefined!';
      }
      tree.addChild(parent, name)
    }
  });
  console.log('number of ontology items in the tree', tree.size(), ' out of ', data['Description'].length);
  return tree;
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
function processName(name) {
  return name.replaceAll('(', '')
    .replaceAll(')', '')
    .replaceAll('\'', '')
    .replaceAll('  ', ' ')
    .replaceAll(' ', '-')
    .toLowerCase();
}

/**
 * Match the definitions with the ontology terms and add them as data to the tree nodes
 *
 * @param tree: {TreeBuilder}: the tree structure of the ontology
 * @param definitions: the definitions to be matched with the ontology
 */
function parseDefintions(tree, definitions) {
  let termWithDefinition = 0;
  definitions.forEach(function (definition) {
    let name = processName(definition['Term']);
    if (tree.getNode(name)) {
      tree.getNode(name).data = definition;
      termWithDefinition++;
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
 * @returns {TreeBuilder}: instance of TreeBuilder that produces the tree structure with the terms and their definitions to be used in d3tree visualization
 */
function processData(ontology, definitions) {
  let tree = parseOntology(ontology);
  parseDefintions(tree, definitions);
  return tree;
}
