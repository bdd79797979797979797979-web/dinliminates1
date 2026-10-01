const assert=require('assert/strict');
const handler=require('../api/restaurants');

const known=handler._test?.knownRestaurantWebsite;
const score=handler._test?.websitePageScore;
const verify=handler._test?.verifiedWebsiteCandidate;
const resolve=handler._test?.resolveOfficialWebsite;

assert.equal(typeof known,'function','known website helper should exist');
assert.equal(typeof score,'function','website page scorer should exist');
assert.equal(typeof verify,'function','website verifier should exist');
assert.equal(typeof resolve,'function','official website resolver should exist');

// There should be no Camacho-specific hardcoded exception.
assert.equal(known({name:"Camacho's Famous",brand:''}),'','Camacho should be discovered generically, not via a special case.');

const camachoHtml='<html><head><title>Camacho\'s Famous</title></head><body><h1>Camacho\'s Famous</h1><p>Bringing authentic Chicago-style pizza to Clarksville, TN.</p><p>1021 Highway 76, Clarksville, TN 37043, Suite 106</p><a href="/contact">Contact</a></body></html>';
const camachoCandidate=verify({url:'https://www.camachosfamous.com/',html:camachoHtml},"Camacho's Famous",'1021 Highway 76, Clarksville, TN 37043, Suite 106','');
assert.ok(camachoCandidate && camachoCandidate.score>=62,'Exact business page should verify as official-site candidate');

const honeyHtml='<html><head><title>HoneyBaked of Clarksville</title></head><body><h1>HoneyBaked of Clarksville</h1><p>Visit our Clarksville store.</p><p>1822 Fort Campbell Blvd, Clarksville, TN 37042</p><p>HoneyBaked meals, sandwiches and catering.</p><a>Locations</a></body></html>';
const honeyCandidate=verify({url:'https://www.honeybaked.com/stores/1822',html:honeyHtml},'HoneyBaked of Clarksville','1822 Fort Campbell Blvd, Clarksville, TN 37042','HoneyBaked');
assert.ok(honeyCandidate,'Exact store page should verify as a local HoneyBaked website');

const directoryHtml='<html><body><h1>Camacho\'s Famous</h1><p>1021 Highway 76, Clarksville, TN</p></body></html>';
const directoryCandidate=verify({url:'https://www.yelp.com/biz/camachos-famous-clarksville',html:directoryHtml},"Camacho's Famous",'1021 Highway 76, Clarksville, TN','');
assert.equal(directoryCandidate,null,'Blocked directory sites must not become official website candidates');

resolve({name:"Wendy's",address:'2800 Wilma Rudolph Blvd, Clarksville, TN 37040',website:'https://www.wendys.com'}).then(result=>{
 assert.equal(result.website,'https://www.wendys.com','Provider website should remain highest-priority source');
 console.log('Dinliminate official website resolver smoke: PASS');
}).catch(err=>{console.error(err);process.exit(1)});
