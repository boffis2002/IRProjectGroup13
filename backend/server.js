const express = require('express');
const cors = require("cors");
const app = express();
const axios = require('axios');
const { execute, deleteDocumentsByQuery, addDocumentToSolr, queryToSolr,RemoveFromList, stopwords } = require('./functions');
app.use(cors());
app.use(express.json());

const SOLR_BASE_URL = 'http://localhost:8983/solr/babysitter_core';
const babysitters = require("./data_retrieved.json");
let liked=[];
let disliked=[];


async function main() {
    try {
        await execute('solr-9.7.0/bin/solr stop');
        await execute('solr-9.7.0/bin/solr start');
        await execute('solr-9.7.0/bin/solr create -c babysitter_core');
        // await execute('python3 ./retrieve.py');
        await deleteDocumentsByQuery();
        await addDocumentToSolr(babysitters);
        const PORT = 3000;
        app.listen(PORT, () => {
            console.log(`Server executing at http://localhost:${PORT}`);
        });
        console.log("Server and components initialized!");
    } catch (error) {
        console.error("Main function got a problem:", error);
    }
}

main();
const alphabet="qwertyuiopasdfghjklzxcvbnm";
function removeNonAlphabetCharacters(input) {
    let output="";
    for(let i=0;i<input.length;i++){
        if(alphabet.includes(input[i].toLowerCase())||input[i]==" "){
            output+=input[i];
        }
    }
    return output
}

app.get("/api/results", async (req, res) => {
    let query="";
    if(liked.length>0){
    liked.forEach(e=>{
        e=e.replace("<b>","").replace("</b>","").replace("\n","").replace("\r","");
        e=removeNonAlphabetCharacters(e);
        let words=e.split(" ");
        let CapitalWords=[];
        words.forEach(x=>{
            if(x!==""&&!stopwords.includes(x.toLowerCase())&&x[0]==x[0].toUpperCase())CapitalWords.push(x);
        });
        CapitalWords.forEach(x=>{
            query+="description:*" + x + "* OR ";
        });
    });}
    if(disliked.length>0){
    disliked.forEach(e=>{
        e=e.replace("<b>","").replace("</b>","").replace("\n","").replace("\r","");
        e=removeNonAlphabetCharacters(e);
        let words=e.split(" ");
        let CapitalWords=[];
        words.forEach(x=>{
            if(x!==""&&!stopwords.includes(x.toLowerCase())&&x[0]==x[0].toUpperCase())CapitalWords.push(x);
        });
        CapitalWords.forEach(x=>{
            query+="-description:*" + x + "* OR ";
        });

    });
    }
    const tokens=req.query.query.split(" ").filter(e => e!=="");
    let secondQuery="";
    tokens.forEach(e => {
        if(e!==""){
        query+="name:" + e + "* OR description:*" + e + "* OR age:*" + e + "* OR salary:*" + e + "* ";
        secondQuery+="name:" + e + "* OR description:*" + e + "* OR age:*" + e + "* OR salary:*" + e + "* ";
        if(e!=tokens[tokens.length-1]) {query+=" OR ";secondQuery+=" OR ";}}
    });
    console.log(query);
 
    const solrResults = await queryToSolr(query);
    const secondsolrResults = await queryToSolr(secondQuery);
    const ress=solrResults.data;
    const ress2=secondsolrResults.data;
    function highlightWordContainingSubstring(text, substring) {
        const regex = new RegExp(`\\b\\w*${substring}\\w*\\b`, 'gi');
        return text.replace(regex, (match) => `<b>${match}</b>`);
    }
    let ageRange = JSON.parse(req.query.ageRange);
    let salaryRange = JSON.parse(req.query.salaryRange);

    if (Array.isArray(ageRange) && Array.isArray(salaryRange) &&
        ageRange[0] === 0 && ageRange[1] === 100 && salaryRange[0] === 0 && salaryRange[1] === 100) {
        
        const ages = ress.response.docs.map((item) => parseInt(item.age[0], 10)).filter((val) => !isNaN(val));
        const salaries = ress.response.docs.map((item) => {
            const salary = typeof item.salary[0] === "string" 
                ? parseFloat(item.salary[0].replace(/[^0-9.]/g, "")) 
                : item.salary[0];
            return !isNaN(salary) ? salary : null;
        }).filter((val) => val !== null);

        ageRange = ages.length > 0 ? [Math.min(...ages), Math.max(...ages)] : [0, 100];
        salaryRange = salaries.length > 0 ? [Math.min(...salaries), Math.max(...salaries)] : [0, 100];
    } 

    let rsults=[];
    if(ress2.response.docs.length!=0){
        ress.response.docs.forEach(e => {
            if(typeof e.salary[0] == "string") e.salary[0]=parseFloat(e.salary[0].replace(/[^0-9.]/g, ""))
                    
            if((e.age[0]>=ageRange[0]&&e.age[0]<=ageRange[1]&&e.salary[0]<=salaryRange[1]&&e.salary[0]>=salaryRange[0])==true){
                tokens.forEach(x => {
                    if(x!==""){
                    e.description[0] = highlightWordContainingSubstring(e.description[0], x);}
                });
                rsults.push(e);
            }
        });
    }   
    const numfound=rsults.length;

    const results = rsults;
    let suggestionParams = null;
    let sugg = [];

    if (results.length > 0) {
        const ages = results.map((item) => parseInt(item.age[0], 10));
        const salaries = results.map((item) =>
            typeof item.salary[0] === "string"
                ? parseFloat(item.salary[0].replace(/[^0-9.]/g, ""))
                : item.salary[0]
        );

        const avgAge = Math.round(ages.reduce((sum, a) => sum + a, 0) / ages.length);
        const avgSalary = Math.round(salaries.reduce((sum, s) => sum + s, 0) / salaries.length);

        suggestionParams = {
            ageRange: [Math.max(avgAge - 2, Math.min(...ages)), Math.min(avgAge + 2, Math.max(...ages))],
            salaryRange: [Math.max(avgSalary - 2, Math.min(...salaries)), Math.min(avgSalary + 2, Math.max(...salaries))],
        };
    
        let suggQuery = "*:*"; 
        if (suggestionParams) {
            suggQuery = `age:[${suggestionParams.ageRange[0]} TO ${suggestionParams.ageRange[1]}] AND salary:[${suggestionParams.salaryRange[0]} TO ${suggestionParams.salaryRange[1]}]`;
        }

        const solrUrl = `${SOLR_BASE_URL}/select`;
        const params = new URLSearchParams({
            q: suggQuery,
            wt: 'json',
            rows: 3,
        });
        
        const response = await axios.get(solrUrl, { params });
        sugg = response.data.response.docs;

        sugg = sugg.filter(
            (suggestion) => 
                !results.some(
                    (result) =>result.id === suggestion.id
                )
        );
    }

    if (solrResults) {
        res.json([rsults, sugg, numfound, ageRange, salaryRange]);
    } else {
        res.status(500).json({ error: 'Solr encurred in an error while searching' });
    }
});

app.post("/api/results/feedback", async (req,res)=>{
    if(req.query.feedback=="like"){
        if(disliked.includes(req.body.description)){
            disliked=await RemoveFromList(disliked,req.body.description);
        }
        if(!liked.includes(req.body.description))liked.push(req.body.description);
    }
    else if(req.query.feedback=="dislike"){
        if(liked.includes(req.body.description)){
            liked=await RemoveFromList(liked,req.body.description);
        }
        if(!disliked.includes(req.body.description)) disliked.push(req.body.description);
    }
    res.status(200).json({answer: "Feedback accepted"});
});