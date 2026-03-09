"""
/autocomplete  — fast-autocomplete powered word suggestions

GET /autocomplete?q=hel&limit=6
  → Public: uses global corpus only
  → Authenticated (Bearer token): merges user's custom vocabulary first

Custom vocab words always rank above global corpus (weight 200+).
"""

from fastapi import APIRouter, Query, Depends, Request
from functools import lru_cache
from typing import Optional
import firebase_admin.auth as fb_auth

router = APIRouter(prefix="/autocomplete", tags=["autocomplete"])

# ── Global corpus ──────────────────────────────────────────────────────────────
WORD_FREQ: dict[str, list] = {}

TIER1 = [
    "the","be","to","of","and","a","in","that","have","it","for","not","on","with",
    "he","as","you","do","at","this","but","his","by","from","they","we","say","her",
    "she","or","an","will","my","one","all","would","there","their","what","so","up",
    "out","if","about","who","get","which","go","me","when","make","can","like","time",
    "no","just","him","know","take","people","into","year","your","good","some","could",
    "them","see","other","than","then","now","look","only","come","its","over","think",
    "also","back","after","use","two","how","our","work","first","well","way","even",
    "new","want","because","any","these","give","day","most","us","great","between",
    "need","large","often","hand","high","place","hold","such","turn","here","why",
    "help","talk","where","school","never","start","city","play","small","number","off",
    "always","next","food","keep","children","feet","land","side","without","once",
    "book","hear","stop","miss","idea","body","music","color","stand","sun","question",
    "fish","area","mark","dog","horse","birds","problem","complete","room","knew",
    "since","ever","piece","told","usually","friends","easy","heard","order","red",
    "door","sure","become","top","ship","across","today","during","short","better",
    "best","however","low","hours","black","happened","whole","measure","remember",
    "early","waves","reached","listen","wind","rock","space","covered","fast","several",
    "himself","toward","five","step","morning","passed","true","hundred","against",
    "slowly","money","map","farm","draw","voice","power","town","fine","led","cry",
    "dark","machine","note","plan","star","box","field","rest","correct","able","done",
    "front","teach","week","final","gave","green","quick","develop","ocean","warm",
    "free","minute","strong","special","mind","behind","clear","produce","fact",
    "street","lot","nothing","course","stay","wheel","full","force","blue","object",
    "decide","surface","deep","moon","island","foot","yet","busy","test","record",
    "boat","common","gold","possible","plane","age","dry","wonder","laugh","thousand",
    "ago","ran","check","game","shape","yes","hot","brought","heat","snow","bring",
    "both","sit","fall","carry","sell","million","guess",
]
TIER2 = [
    "hello","world","please","thank","sorry","maybe","really","already","together",
    "family","father","mother","brother","sister","friend","house","water","light",
    "night","right","wrong","every","little","something","nothing","everything",
    "anything","someone","anyone","everyone","somewhere","nowhere","everywhere",
    "beautiful","wonderful","amazing","awesome","excellent","perfect","important",
    "different","interesting","difficult","possible","necessary","available",
    "understand","information","question","attention","situation","position",
    "condition","operation","organization","education","experience","knowledge",
    "technology","community","government","environment","development","management",
    "communication","responsibility","opportunity","president","company","national",
    "political","economic","social","cultural","personal","physical","mental",
    "emotional","natural","historical","traditional","international","additional",
    "original","general","normal","central","medical","professional","commercial",
    "industrial","financial","military","religious","official","various","certain",
    "similar","common","real","simple","clear","open","close","move","live","happen",
    "seem","feel","try","leave","call","let","begin","show","cut","watch","minute",
    "second","third","morning","evening","afternoon","tonight","yesterday","tomorrow",
    "weekend","monday","tuesday","wednesday","thursday","friday","saturday","sunday",
    "january","february","march","april","june","july","august","september","october",
    "november","december","birthday","holiday","vacation","travel","restaurant",
    "hospital","airport","library","university","terrible","horrible","fantastic",
    "brilliant","clever","stupid","angry","happy","sad","tired","hungry","thirsty",
    "sick","healthy","strong","weak","tall","short","fat","thin","young","old",
    "language","alphabet","finger","gesture","signing","interpret","communicate",
    "disability","hearing","visual","speech","translate","caption","subtitle",
]
TIER3 = [
    "ability","absence","absolute","academic","accident","achieve","acquire","action",
    "active","actual","adapt","address","adequate","admit","adopt","advance","affect",
    "afford","agency","agenda","agree","alert","align","allocate","allow","alter",
    "analysis","analyze","announce","apply","approve","argue","arrange","assess",
    "assign","assist","assume","attach","attend","attitude","attract","authority",
    "balance","benefit","budget","capable","capacity","capture","career","careful",
    "challenge","chance","channel","charge","chemical","choice","citizen","claim",
    "collect","combine","commit","compare","compete","complex","concept","conflict",
    "connect","consider","construct","contact","content","contract","control",
    "convert","create","crisis","culture","cycle","debate","defend","define",
    "deliver","demand","depend","describe","design","detail","detect","determine",
    "direct","discuss","display","distribute","divide","document","economy",
    "effective","efficient","effort","element","eliminate","enable","energy","enforce",
    "engage","enhance","ensure","entire","equal","establish","evaluate","examine",
    "exchange","execute","expand","expect","explain","explore","express","extend",
    "factor","failure","feature","focus","format","function","generate","global",
    "handle","identify","impact","implement","improve","include","increase","indicate",
    "influence","initiate","input","integrate","invest","involve","issue","launch",
    "leader","learn","limit","maintain","measure","method","model","monitor","motion",
    "network","obtain","operate","outcome","output","overcome","perform","prevent",
    "process","program","project","promote","provide","publish","purchase","quality",
    "receive","reduce","reflect","release","remove","replace","require","resolve",
    "respond","result","return","review","schedule","section","secure","select",
    "service","single","solution","source","status","strategy","structure","subject",
    "submit","supply","support","system","target","technique","transfer","transform",
    "update","utilize","value","verify","vision","volume","welfare",
]

for w in TIER1: WORD_FREQ[w.lower()] = [{}, 100, []]
for w in TIER2: WORD_FREQ[w.lower()] = [{}, 60,  []]
for w in TIER3: WORD_FREQ[w.lower()] = [{}, 20,  []]


@lru_cache(maxsize=1)
def _get_global_engine():
    from fast_autocomplete import AutoComplete
    return AutoComplete(words=WORD_FREQ)


def _prefix_search(corpus: dict, prefix: str, limit: int, exclude: set = None) -> list[str]:
    """Plain prefix search sorted by weight descending. Always works without fast-autocomplete."""
    exclude = exclude or set()
    matches = sorted(
        [w for w in corpus if w.startswith(prefix) and w not in exclude],
        key=lambda w: -corpus[w][1] if isinstance(corpus[w], list) else -corpus[w]
    )
    return matches[:limit]


def _fast_search(engine, corpus: dict, prefix: str, limit: int) -> list[str]:
    """Use fast-autocomplete engine, keep only prefix-matching results."""
    try:
        raw  = engine.search(word=prefix, max_cost=1, size=limit * 3)
        seen = set()
        out  = []
        for group in raw:
            for word in group:
                w = word.lower()
                if w not in seen and w.startswith(prefix):
                    seen.add(w); out.append(w)
                if len(out) >= limit: break
            if len(out) >= limit: break
        # pad with plain prefix matches
        if len(out) < limit:
            extra = _prefix_search(corpus, prefix, limit - len(out), seen)
            out.extend(extra)
        return out[:limit]
    except Exception:
        return _prefix_search(corpus, prefix, limit)


@router.get("")
async def suggest(
    request: Request,
    q:     str = Query(..., min_length=1, max_length=30),
    limit: int = Query(default=6, ge=1, le=12),
):
    prefix = q.lower().strip()
    if not prefix:
        return {"suggestions": []}

    # ── Try to identify authenticated user for custom vocab ──────────────────
    user_vocab: dict[str, int] = {}  # { word: weight }
    try:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]
            decoded = fb_auth.verify_id_token(token)
            firebase_uid = decoded["uid"]

            # Lazy import to avoid circular dependency
            from database import SessionLocal
            from routers.vocabulary import get_user_vocab_words
            import models as m

            db = SessionLocal()
            try:
                user = db.query(m.User).filter(m.User.firebase_uid == firebase_uid).first()
                if user:
                    user_vocab = get_user_vocab_words(db, user.id)
            finally:
                db.close()
    except Exception:
        pass  # unauthenticated or token error — fall back to global only

    # ── Build combined corpus ─────────────────────────────────────────────────
    # Custom vocab words get weight 200+ → always appear before global words
    combined = {**WORD_FREQ, **{w: [{}, weight, []] for w, weight in user_vocab.items()}}

    # ── Search ────────────────────────────────────────────────────────────────
    # Custom vocab exact prefix matches come first, then global engine
    custom_matches = [w for w in user_vocab if w.startswith(prefix)]
    custom_matches.sort(key=lambda w: -user_vocab[w])

    if len(custom_matches) >= limit:
        return {"suggestions": custom_matches[:limit]}

    remaining = limit - len(custom_matches)
    custom_set = set(custom_matches)

    try:
        engine  = _get_global_engine()
        global_matches = _fast_search(engine, WORD_FREQ, prefix, remaining * 2)
    except ImportError:
        global_matches = _prefix_search(WORD_FREQ, prefix, remaining * 2)

    global_matches = [w for w in global_matches if w not in custom_set][:remaining]

    return {"suggestions": (custom_matches + global_matches)[:limit]}
