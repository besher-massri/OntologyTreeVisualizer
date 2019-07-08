# OntologyTreeVisualizer
Simple tool for visualizing the ontology tree.

The datasets used are:
- Ontology file: which contain the ontology terms in rdf form (converted to json)
- Defintions file: which contain defintion of the terms along with its topics and synonyms

For creating the tree:
- The nodes were the ontology terms identified by their url in `@about` field (the name was just whatever after http://www.informea.org/terms/). 
- The parent children relationship was formed based on the field `broader`, which represent the broader concept.
- Those with no `broader` property has been neglected.
- Terms with url prefix: `http://www.informea.org/terms/xl_en` are aliases to other terms, those were also removed.

The defintions were matched with the terms to provide extra information about the terms.

The tool was written in JavaScript and the graph was made using the d3.js library.



## Acknowledgments
This work is developed by [AILab](http://ailab.ijs.si/) at [Jozef Stefan Institute](https://www.ijs.si/).

The work is supported by the [EnviroLens project](https://envirolens.eu/),
a project that demonstrates and promotes the use of Earth observation as direct evidence for environmental law enforcement, including in a court of law and in related contractual negotiations.
