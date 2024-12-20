const { exec } = require('child_process');
const { promisify } = require('util');
const axios = require('axios');
const fs = require('fs');

const SOLR_BASE_URL = 'http://localhost:8983/solr/babysitter_core';
const execAsync = promisify(exec);

async function execute(command) {
    try {
        const { stdout, stderr } = await execAsync(command);
        if (stderr) console.error(`Command error: ${stderr}`);
        console.log(`${stdout}`);
    } catch (error) {
        console.error(`Executing the command caused an error: ${error.message}`);
    }
}

async function deleteDocumentsByQuery() {
    try {
        const deleteXml = fs.readFileSync('./deleteAll.xml', 'utf-8');
        const solrUrl = `${SOLR_BASE_URL}/update?commit=true`;
        await axios.post(solrUrl, deleteXml, { headers: { 'Content-Type': 'text/xml' } });
    } catch (error) {
        console.error("Document deleting caused an error:", error);
    }
}

async function addDocumentToSolr(document) {
    try {
        const solrUrl = `${SOLR_BASE_URL}/update?commit=true`;
        await axios.post(solrUrl, document, { headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        console.error("Document adding caused an error:", error);
    }
}

async function queryToSolr(query) {
    try {
        const solrUrl = `${SOLR_BASE_URL}/select`;
        const params = new URLSearchParams({
            q: query,
            wt: 'json',
            rows: 1000,
        });
        return await axios.get(solrUrl, { params });
    } catch (error) {
        console.error("Error in thr Solr request:", error);
        return null;
    }
}
async function RemoveFromList(list,element) {
    let newList=[];
    list.forEach(e => {
        if(e!==element) newList.push(e);
    });
    return newList;
}

const stopwords = [
    "ciao", "a", "ad", "ai", "al", "alla", "allo", "all", "agli", "alle", "anche", "ancora", "avere", 
    "aver", "che", "chi", "ci", "come", "con", "così", "da", "dai", "dal", "dalla", "dalle", 
    "dallo", "dei", "del", "della", "dello", "dentro", "detto", "di", "dopo", "dove", "due", 
    "e", "è", "ed", "era", "erano", "essere", "fare", "fatto", "fra", "fu", "già", "gli", 
    "ha", "hai", "hanno", "ho", "il", "in", "io", "l", "la", "le", "lei", "li", "lo", 
    "loro", "lui", "ma", "me", "mentre", "mi", "mia", "mie", "miei", "molto", "ne", "nei", 
    "nella", "nelle", "nello", "noi", "non", "nostra", "nostre", "nostri", "o", "oh", "oltre", 
    "più", "per", "perché", "poi", "quale", "quali", "quasi", "quella", "quelle", "quelli", 
    "quello", "quest", "questa", "queste", "questi", "questo", "qui", "quindi", "sarà", 
    "saranno", "se", "sei", "si", "sia", "siamo", "siete", "sono", "sta", "stai", "stanno", 
    "stati", "stato", "stessa", "stesse", "stessi", "stesso","sto", "su", "sua", "sue", "sui", 
    "sul", "sulla", "sulle", "sullo", "suo", "suoi", "tra", "tu", "tua", "tue", "tuo", 
    "tuoi", "tutta", "tutte", "tutti", "tutto", "un", "una", "uno", "va", "vai", "vanno", 
    "venne", "verrà", "vi", "voi", "vostra", "vostre", "vostri", "vuoi", "vuo", "è", "italiano", 
    "francese", "tedesco", "spagnolo", "inglese", "americano", "canadese", "russo", "cinese", 
    "giapponese", "indiano", "brasiliano", "australiano", "portoghese", "olandese", "svedese", 
    "norvegese", "danese", "finlandese", "svizzero", "belga", "austriaco", "messicano", "argentino", 
    "turco", "egiziano", "marocchino", "sudafricano", "chiamo", "italiana", "francese", "tedesca", 
    "spagnola", "inglese", "americana", "canadese", "russa", "cinese", "giapponese", "indiana", 
    "brasiliana", "australiana", "portoghese", "olandese", "svedese", "norvegese", "danese", 
    "finlandese", "svizzera", "belga", "austriaca", "messicana", "argentina", "turca", "egiziana", 
    "marocchina", "sudafricana", "ogni", "alcuni", "qualche", "molti", "nessuno", "alcun", "soltanto", 
    "nessuna", "nessuno", "quando", "mentre", "durante", "allora", "appena", "quindi", "comunque", 
    "soprattutto", "anche", "ancora", "intanto", "fino", "poi", "prima", "almeno", "poiché", "infatti", 
    "così", "qualunque", "altro", "altri", "qualcosa", "piuttosto", "addirittura", "sempre", "mai", 
    "dopo", "innanzitutto", "come", "come", "davvero", "solitamente", "forse", "ovviamente", "però", 
    "tuttavia", "certo", "comunque", "sebbene", "almeno", "invece", "ancora", "giusto", "nessuna", 
    "ovvero", "finalmente", "si", "sì", "più", "poco", "nessuno", "tanto", "quello", "tutto", 
    "adesso", "altre", "quale", "quelli", "quella", "qualcuno", "tutto", "tutt'altro", "essendo", 
    "invece", "comunque", "così", "come", "di più", "nonostante", // Italian stopwords

    // English stopwords
    "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", "yours", "yourself", 
    "yourselves", "he", "him", "his", "himself", "she", "her", "hers", "herself", "it", "its", "itself", 
    "they", "them", "their", "theirs", "themselves", "what", "which", "who", "whom", "this", "that", 
    "these", "those", "am", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "having", 
    "do", "does", "did", "doing", "an", "the", "and", "but", "if", "or", "because", "as", "until", 
    "while", "of", "at", "by", "for", "with", "about", "against", "between", "into", "through", "during", 
    "before", "after", "above", "below", "to", "from", "up", "down", "in", "out", "on", "off", "over", 
    "under", "again", "further", "then", "once", "here", "there", "when", "where", "why", "how", "all", 
    "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", 
    "own", "same", "so", "than", "too", "very", "s", "t", "can", "will", "just", "don", "should", "now", 
    "d", "ll", "m", "o", "re", "ve", "y", "ain", "aren", "couldn", "didn", "doesn", "hadn", "hasn", 
    "haven", "isn", "ma", "mightn", "mustn", "needn", "shan", "shouldn", "wasn", "weren", "won", "wouldn",

    // Alphabet
    "b", "c", "f", "g", "h", "j", "k", "l", "n", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"
];


module.exports = { execute, deleteDocumentsByQuery, addDocumentToSolr, queryToSolr, RemoveFromList,stopwords };