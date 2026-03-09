"""
/autocomplete  — fast-autocomplete powered word suggestions

GET /autocomplete?q=hel&limit=6
Returns: { "suggestions": ["hello", "help", "held", ...] }

Uses fast-autocomplete's AutoComplete class with a preloaded English
word corpus weighted by frequency so common words surface first.

Startup cost: ~0.3s to build the trie. Subsequent calls: <5ms.
"""

from fastapi import APIRouter, Query
from functools import lru_cache

router = APIRouter(prefix="/autocomplete", tags=["autocomplete"])

# ── Word corpus ────────────────────────────────────────────────────────────────
# Common English words weighted by rough frequency tier.
# Format expected by fast-autocomplete: { "word": [{}, count, []] }
# count drives ranking — higher = shown first.

WORD_FREQ: dict[str, list] = {}

# Tier 1 — very common (weight 100)
TIER1 = [
    "the","be","to","of","and","a","in","that","have","it",
    "for","not","on","with","he","as","you","do","at","this",
    "but","his","by","from","they","we","say","her","she","or",
    "an","will","my","one","all","would","there","their","what",
    "so","up","out","if","about","who","get","which","go","me",
    "when","make","can","like","time","no","just","him","know",
    "take","people","into","year","your","good","some","could",
    "them","see","other","than","then","now","look","only","come",
    "its","over","think","also","back","after","use","two","how",
    "our","work","first","well","way","even","new","want","because",
    "any","these","give","day","most","us","great","between","need",
    "large","often","hand","high","place","hold","such","turn","here",
    "why","help","talk","where","school","never","start","city","play",
    "small","number","off","always","next","food","keep","children",
    "feet","land","side","without","once","book","hear","stop","miss",
    "idea","body","music","color","stand","sun","question","fish","area",
    "mark","dog","horse","birds","problem","complete","room","knew",
    "since","ever","piece","told","usually","didn","friends","easy",
    "heard","order","red","door","sure","become","top","ship","across",
    "today","during","short","better","best","however","low","hours",
    "black","products","happened","whole","measure","remember","early",
    "waves","reached","listen","wind","rock","space","covered","fast",
    "several","hold","himself","toward","five","step","morning","passed",
    "vowel","true","hundred","against","pattern","numeral","table","north",
    "slowly","money","map","farm","pulled","draw","voice","power","town",
    "fine","drive","led","cry","dark","machine","note","waited","plan",
    "star","box","noun","field","rest","correct","able","pound","done",
    "beauty","drive","stood","contain","front","teach","week","final",
    "gave","green","oh","quick","develop","ocean","warm","free","minute",
    "strong","special","mind","behind","clear","tail","produce","fact",
    "street","inch","lot","nothing","course","stay","wheel","full","force",
    "blue","object","decide","surface","deep","moon","island","foot","yet",
    "busy","test","record","boat","common","gold","possible","plane","age",
    "dry","wonder","laugh","thousand","ago","ran","check","game","shape",
    "yes","hot","miss","brought","heat","snow","tire","bring","yes","both",
    "sit","fall","carry","game","sell","decide","million","guess","yes",
    "cat","dog","mouse","rat","fly","wolf","bear","rabbit","bird","nice",
    "buy","borrow","rent","coin","cash","bucks","eat","drink","breathe","smoke",
    "inhale","exhale","push","pull","throw","drop","fetch","add","subtract",
    "multiply","divide","card","band","sing","dance","relax","sleep","dream",
]

# Tier 2 — common (weight 60)
TIER2 = [
    "hello","world","please","thank","sorry","maybe","really","already",
    "together","family","father","mother","brother","sister","friend",
    "house","water","light","night","right","wrong","every","little",
    "something","nothing","everything","anything","someone","anyone",
    "everyone","somewhere","nowhere","everywhere","anywhere","beautiful",
    "wonderful","amazing","awesome","excellent","perfect","important",
    "different","interesting","difficult","possible","necessary","available",
    "specific","particular","significant","previous","following","according",
    "understand","information","question","attention","situation","position",
    "condition","relation","operation","production","organization","education",
    "experience","knowledge","technology","community","government","environment",
    "development","management","communication","responsibility","opportunity",
    "president","company","national","political","economic","social","cultural",
    "personal","physical","mental","emotional","natural","historical","traditional",
    "international","additional","original","general","normal","central","medical",
    "professional","commercial","industrial","financial","military","religious",
    "official","political","special","various","certain","possible","likely",
    "similar","common","real","simple","clear","open","close","low","high",
    "bring","until","change","point","play","small","number","off","always",
    "move","live","happen","seem","feel","try","leave","call","keep","let",
    "begin","show","hear","stop","cut","watch","minute","second","third",
    "morning","evening","afternoon","tonight","yesterday","tomorrow","weekend",
    "monday","tuesday","wednesday","thursday","friday","saturday","sunday",
    "january","february","march","april","june","july","august","september",
    "october","november","december","birthday","holiday","vacation","travel",
    "restaurant","hospital","airport","library","university","government",
    "beautiful","wonderful","terrible","horrible","excellent","fantastic",
    "perfect","amazing","awesome","brilliant","clever","stupid","angry",
    "happy","sad","tired","hungry","thirsty","sick","healthy","strong",
    "weak","tall","short","fat","thin","young","old","new","fast","slow",
    "hard","soft","hot","cold","warm","cool","big","small","long","wide",
    "narrow","deep","shallow","heavy","light","dark","bright","quiet","loud",
    "clean","dirty","smooth","rough","sweet","sour","bitter","salty",
    "God","god","Jesus","holy","script","Bible","cross",
]

# Tier 3 — less common but useful (weight 20)
TIER3 = [
    "ability","absence","absolute","academic","accident","achieve","acquire",
    "action","active","actual","adapt","address","adequate","admit","adopt",
    "advance","affect","afford","agency","agenda","agree","alert","align",
    "allocate","allow","alter","analysis","analyze","announce","apply",
    "approve","argue","arrange","assess","assign","assist","assume","attach",
    "attend","attitude","attract","authority","balance","benefit","budget",
    "capable","capacity","capture","career","careful","challenge","chance",
    "channel","charge","chemical","choice","citizen","claim","class","close",
    "collect","combine","commit","compare","compete","complex","concept",
    "conflict","connect","consider","construct","contact","content","contract",
    "control","convert","create","crisis","culture","cycle","debate","defend",
    "define","deliver","demand","depend","describe","design","detail","detect",
    "determine","direct","discuss","display","distribute","divide","document",
    "economy","effective","efficient","effort","element","eliminate","enable",
    "energy","enforce","engage","enhance","ensure","entire","equal","establish",
    "evaluate","examine","exchange","execute","expand","expect","explain",
    "explore","express","extend","factor","failure","feature","focus","format",
    "function","generate","global","handle","identify","impact","implement",
    "improve","include","increase","indicate","influence","initiate","input",
    "integrate","invest","involve","issue","launch","leader","learn","limit",
    "maintain","measure","method","model","monitor","motion","network","obtain",
    "operate","outcome","output","overcome","perform","prevent","process",
    "program","project","promote","provide","publish","purchase","quality",
    "receive","reduce","reflect","release","remove","replace","require","resolve",
    "respond","result","return","review","schedule","section","secure","select",
    "service","single","solution","source","status","strategy","structure",
    "subject","submit","supply","support","system","target","technique","transfer",
    "transform","update","utilize","value","verify","vision","volume","welfare",
    "language","alphabet","finger","gesture","signing","interpret","communicate",
    "disability","hearing","visual","speech","translate","caption","subtitle",
    "fuck","shit","motherfucker","cunt","asshole","bastard","bitch","hell","damn",
    "fool","idiot","stupid","moron","retard","dumbass","imbecile","crap","goddamn",


]

for w in TIER1: WORD_FREQ[w.lower()] = [{}, 100, []]
for w in TIER2: WORD_FREQ[w.lower()] = [{}, 60,  []]
for w in TIER3: WORD_FREQ[w.lower()] = [{}, 20,  []]


@lru_cache(maxsize=1)
def _get_engine():
    """Build AutoComplete engine once and cache it."""
    from fast_autocomplete import AutoComplete
    return AutoComplete(words=WORD_FREQ)


@router.get("")
def suggest(
    q:     str = Query(..., min_length=1, max_length=30),
    limit: int = Query(default=6, ge=1, le=12),
):
    """
    Returns up to `limit` word completions for the prefix `q`.
    Falls back to simple prefix-filter if fast-autocomplete isn't installed.
    """
    q = q.lower().strip()
    if not q:
        return {"suggestions": []}

    try:
        engine = _get_engine()
        # search() returns list of lists: [["word"], ...]
        raw = engine.search(word=q, max_cost=1, size=limit * 2)
        # Flatten and deduplicate, keep only words that START with q (not just fuzzy)
        seen = set()
        results = []
        for group in raw:
            for word in group:
                w = word.lower()
                if w not in seen and w.startswith(q):
                    seen.add(w)
                    results.append(w)
                if len(results) >= limit:
                    break
            if len(results) >= limit:
                break

        # If we still have room, pad with plain prefix matches from corpus
        if len(results) < limit:
            extras = sorted(
                [w for w in WORD_FREQ if w.startswith(q) and w not in seen],
                key=lambda w: -WORD_FREQ[w][1]   # sort by weight desc
            )
            results.extend(extras[:limit - len(results)])

        return {"suggestions": results[:limit]}

    except ImportError:
        # fast-autocomplete not installed — use plain prefix search
        matches = sorted(
            [w for w in WORD_FREQ if w.startswith(q)],
            key=lambda w: -WORD_FREQ[w][1]
        )
        return {"suggestions": matches[:limit]}
