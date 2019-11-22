var express = require('express');
var router = express.Router();
let dataProcessing=require('../core/dataPreprocessing.js');
/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', {title: 'Ontology Tree Visualizer'});
});

router.get('/get-tree', function (req, res, next) {
  res.json(dataProcessing.getTree());
});
router.get('/get-distance-matrix', function (req, res, next) {
  res.json(dataProcessing.getDistanceMatrix());
});

module.exports = router;
