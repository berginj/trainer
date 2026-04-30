# Youth Training and Performance Tracking Platform for Ages 8–15

This report synthesizes guidance and evidence from entity["organization","American Academy of Pediatrics","us pediatric association"], the entity["organization","International Olympic Committee","olympic governing body"], the entity["organization","National Strength and Conditioning Association","strength coaching association"], entity["organization","Major League Baseball","north american baseball league"] Pitch Smart, the entity["organization","American Sports Medicine Institute","sports medicine research alabama"], the entity["organization","National Federation of State High School Associations","us high school sports federation"], entity["organization","USA Baseball","us baseball governing body"], entity["organization","USA Softball","us softball governing body"], and entity["organization","FitBack","youth fitness platform"], plus peer-reviewed youth sport and pediatric sports-medicine literature. The structure, scope, product constraints, and deliverables follow the project brief you supplied. citeturn19search2turn0search1turn51search3turn46view1turn21view0turn49view0turn17search17turn15view0 fileciteturn0file0

## Executive Summary

A high-quality youth platform should **track repeated, simple, low-cost measures better than it tracks rare, high-tech measures**. For ages 8–15, the best launch metrics are not fancy biomechanics outputs. They are: height history, pain/soreness/energy/sleep, participation status, throwing and pitching workload, session RPE, 10 m sprint, a jump test, a simple change-of-direction test, a balance/control screen, and a small number of sport-specific skill tests that are repeatable in ordinary settings. These measures are useful because they are practical, sensitive to growth and fatigue, and support longitudinal development without forcing adult-style profiling onto children. citeturn0search1turn19search2turn51search3turn35search1turn34search0turn15view0

The biggest product mistake would be treating youth athletes like miniature pros. The evidence base is clear that growth, maturation, and specialization materially change both performance and injury risk. Early maturers are often faster, stronger, and more powerful in the short term; that does **not** mean they have higher long-term potential. Around peak height velocity, injury risk and movement variability rise, and performance can temporarily become noisier. The platform therefore needs maturity-aware interpretation, within-player trend emphasis, and benchmark confidence labels instead of hard rankings. citeturn33search1turn33search5turn33search0turn38view0turn32search15

The biggest operational risks are overuse, fatigue, growth-spurt-related vulnerability, early specialization, velocity chasing, and public comparison pressure. In baseball, overuse and fatigue are the dominant modifiable risks, and formal pitch count/rest guidance is strong enough to embed directly into the product. In softball, the injury and workload signal is real, but the formal rule-quality evidence is weaker; the platform should therefore monitor exposure aggressively while labeling recommendations as guidance rather than medical or regulatory mandates. In basketball, the platform should care less about constant max-output testing and more about landing, deceleration, readiness, and neuromuscular control. citeturn48search0turn46view1turn21view0turn49view0turn18search8turn18search11turn17search1turn17search15

For launch, the product should prioritize six things: player profiles, team rosters, baseline evaluations, daily readiness and workload capture, at-home routine assignment, and coach/parent dashboards with safety flags. It should **not** launch with public leaderboards for sensitive metrics, “AI talent scores,” diagnosis-like language, or overcomplicated benchmark logic where the literature is weak. The correct design center is not scouting. It is safe development. citeturn19search2turn52search14turn52search5turn51search3

## Youth Athlete Development Principles

Youth development is non-linear. The same athlete can look coordinated and explosive one month, then awkward and slower during a rapid growth period, then rebound. Mean peak height velocity occurs roughly around age 12.5 in girls and around age 13.5–14 in boys, but individual timing varies a lot. Methods that estimate biological maturation can help context, but they are not precise enough to behave like a diagnosis or a destiny score in a product. The platform should store growth history, not pretend it can perfectly infer maturity stage from one calculation. citeturn33search0turn33search16turn33search5

The strongest long-term development message is that kids need broad movement competency, age-appropriate strength and neuromuscular training, enough rest, and a mastery-oriented environment. The IOC and NSCA both emphasize that training should be developmentally appropriate, enjoyable, and oriented to long-term athletic development rather than early-result maximization. Supervised resistance training and neuromuscular training are considered safe and useful for children and adolescents when implemented correctly. citeturn0search1turn51search1turn51search3turn36search23turn17search1turn17search11

Early specialization changes the risk equation. AAP guidance and meta-analytic evidence show that higher specialization is associated with greater overuse injury risk, and current pediatric guidance recommends regular rest, at least one day off per week from organized training/competition, and time away from a given sport across the year. The product should therefore reward multi-sport participation, free-play balance, and offseason variety rather than uninterrupted year-round single-sport load. citeturn19search2turn19search5turn52search5turn52search15turn52search9

The platform should also reflect the fact that physical capacities and technical skills do not mature at the same rate. Basketball research in youth cohorts shows maturation effects are stronger for speed, power, and body-size-sensitive outputs than for some technical skills. Longitudinal basketball skill tracking work also suggests that technical development can be unstable and heavily training-dependent, which is one reason broad age-based shooting or dribbling norms are much weaker than broad physical-fitness norms. citeturn38view0turn32search15turn32search3

Finally, subjective monitoring matters. Athlete self-report measures of well-being respond to training load and recovery, and simple subjective tools often track change as well as or better than many objective proxies. In adolescents, poor sleep is associated with increased injury risk. That means a one-minute morning check-in is not fluff; it is one of the highest-value data captures in the entire system. citeturn35search1turn34search0turn37search1turn37search0turn37search7turn37search18

## Metric Inventory

### What should be tracked first

The metric system should be built as a **tiered inventory**: a universal core, then sport-specific add-ons, then optional device-assisted measures. The universal core should work with no special hardware. Sport-specific and device-assisted metrics should plug into the same data model with benchmark confidence metadata.

### Core cross-sport metrics

| Category | Metric | Why it matters | Age appropriateness | Capture method | Equipment | Frequency | Evidence / reliability | Risk of misuse | Recommended platform behavior |
|---|---|---|---|---|---|---|---|---|---|
| Growth | Standing height | Best practical way to detect rapid growth and interpret noisy performance periods | 8–15 | Parent/coach measure | Stadiometer or tape + wall | Every 4–8 weeks | Strong for growth tracking; weaker for exact maturity inference citeturn15view0turn33search5 | Overinterpreting one reading | Store rolling trend; flag unusually rapid change relative to own history |
| Growth | Body mass | Adds context for growth, power, and fatigue tolerance | 8–15 | Home or practice | Scale | Every 4–8 weeks | Moderate utility; do not overemphasize body composition in youth citeturn15view0turn0search1 | Body-image pressure | Hide from player-facing rank views by default |
| Readiness | Sleep duration + quality | Recovery, cognition, injury-risk context | 8–15 | 30-second check-in | None | Daily | Moderate-to-strong practical evidence citeturn37search1turn37search7turn35search1 | Parent policing / guilt | Use baseline + recent trend, not public comparison |
| Readiness | Soreness | Useful fatigue and overload signal | 8–15 | 0–5 or 0–10 rating | None | Daily | Moderate practical evidence citeturn35search1turn34search0 | Kids may underreport to keep playing | Show coach only after parent/guardian consent rules |
| Readiness | Pain location + intensity | Most important safety input | 8–15 | Body-part check + scale | None | Daily / post-session | Strong face validity; critical safety metric citeturn21view0turn49view0 | Ignoring or normalizing pain | Red-flag workflow; no diagnosis language |
| Readiness | Energy / mood / readiness | Low-burden well-being signal | 8–15 | 1–5 score | None | Daily | Moderate practical evidence citeturn35search1turn34search0 | Noise if over-questioned | Keep to one question each |
| Load | Session RPE | Best low-cost internal-load estimate | 8–15 | Player or coach input | None | Every session | Moderate-to-strong practicality citeturn35search2turn34search0turn14search2 | Fake precision | Use broad bands, not decimal math |
| Load | Participation status and minutes | Context for game/practice exposure | 8–15 | Coach or parent entry | None | Every session | Strong practical need citeturn14search2turn19search2 | Missing data | Require at least attended / partial / missed |
| Performance | 10 m sprint | Simple acceleration marker relevant to all three sports | 8–15 | Practice testing | Stopwatch or phone video | Monthly | Moderate; reliable if protocol is standardized citeturn27view0turn15view0 | Chasing small week-to-week changes | Compare only against same protocol and surface |
| Performance | Standing broad jump | Low-cost lower-body power proxy | 8–15 | Practice/home | Tape measure | Monthly | Strong field-test validity and feasibility citeturn15view0turn45search1turn8search3 | Technique variance | Record best of two or three attempts |
| Performance | Vertical jump | Power proxy; useful when measured consistently | 8–15 | Practice/home | Wall touch, phone video, or jump mat | Monthly | Moderate; device method matters citeturn27view0turn30search6 | Device inconsistency | Store protocol and device used with each result |
| Movement control | Single-leg balance | Cheap screen for control and asymmetry | 8–15 | Home/practice | None | Monthly | Moderate practical value; especially as a trend metric citeturn17search1turn17search11 | Turning into a talent score | Use pass/needs work, not percentile pressure |
| Movement control | Hop-and-stick / landing control | Captures deceleration and landing quality | 8–15 | Home/practice | None or phone video | Monthly | Moderate injury-prevention relevance citeturn14search9turn17search1turn30search8 | Subjective scoring drift | Use simple rubric with video examples |
| Mobility | Ankle mobility | Influences landing, squatting, sprinting, jumping | 8–15 | Knee-to-wall test | Tape measure | Monthly | Moderate evidence base citeturn14search1turn14search7 | Overmedicalizing | Track trend and side-to-side difference only |
| Mobility | Hip and thoracic rotation | Relevant for throwing, hitting, and change of direction | 8–15 | Simple rotation screens | None / dowel | Monthly | Moderate practical support citeturn50search0turn18search11 | Low reliability if too technical | Use simple pass/fail or 3-point scale |
| Optional | Grip strength | Useful in throwing sports and general strength profiling | 9–15 | Practice | Hand dynamometer | Monthly or every 8–12 weeks | Moderate evidence, high practicality if device exists citeturn15view0turn27view0 | Comparing to adult norms | Trend within athlete unless local norms exist |

### Sport-specific metrics

| Sport | Metric | Why it matters | Capture practicality | Frequency | Reliability / evidence | Risk of misuse | Platform behavior |
|---|---|---|---|---|---|---|---|
| Basketball | Free throws made out of 20 | Stable, easy shooting skill marker | Easy at home or practice | Weekly | Moderate practical utility; universal youth norms are weak citeturn38view0turn32search15 | Ranking kids by one bad day | Trend by volume and location, not only percentage |
| Basketball | Spot shooting by zone | Better than one global FG% | Practice | Weekly or monthly | Moderate practical utility; norms are weak citeturn38view0turn32search15 | Shot-quality bias | Store attempts + makes by zone |
| Basketball | Layup completion right/left | Combines coordination, footwork, touch | Home or practice | Weekly | Moderate practical value citeturn30search1turn38view0 | Oversimplifying game finishing | Track both sides separately |
| Basketball | Ball-handling challenge time + errors | Repeatable skill task | Home or practice | Weekly | Moderate practical value citeturn30search1turn38view0 | Speed over control | Record time and total errors |
| Basketball | Passing accuracy station | Useful team-skill proxy | Practice | Monthly | Moderate practical value citeturn30search1turn38view0 | Inconsistent setup | Use fixed distance and target size |
| Basketball | Defensive shuffle / COD drill | Positioning and movement efficiency | Practice | Monthly | Moderate; maturation-sensitive citeturn38view0turn30search6 | Comparing pre- and post-growth-spurt athletes unfairly | Show maturity-context banner |
| Basketball | Landing/deceleration rubric | Important safety and performance screen | Home or practice with phone video | Monthly | Moderate injury-prevention relevance citeturn17search1turn17search15turn30search8 | Amateur biomechanics overreach | Use simple coach education, not anatomy jargon |
| Baseball | Throwing velocity | Available performance marker for field players | Practice with radar | Monthly | Moderate utility; position-specific norms are limited citeturn27view0turn21view0 | Velocity chasing | Hide “leaderboard” views; pair with pain/readiness |
| Baseball | Pitching velocity | Important performance marker for pitchers | Practice with radar | Monthly | Moderate evidence; usable age-band means exist in one youth sample citeturn27view0turn28view2 | Strong misuse risk | Never display without workload and pain context |
| Baseball | Strike percentage / command | More developmentally appropriate than velo alone | Practice/game | Weekly | Strong practical value citeturn48search0turn21view0 | Chasing nibbles over mechanics | Track volume and zone targets |
| Baseball | Pitch count / innings / days rest | Core durability metric | Practice/game | Every outing | Strong enough to embed directly citeturn46view1turn46view0turn47view1turn46view2 | None; this is protective | Automatic rest-lock rules |
| Baseball | Exit velocity | Useful, but device-specific | Practice with radar/sensor | Monthly if available | Weak-to-moderate youth norm base | Device noise / obsession | Store but benchmark internally unless admin adds local norms |
| Baseball | Fielding rep success + throwing accuracy | Higher utility for most youth players than raw velo | Practice | Weekly | Moderate practical value citeturn21view0turn19search8 | Subjective scoring | Use fixed drill templates |
| Softball | Overhand throwing velocity | Useful for field-player development | Practice with radar | Monthly | Moderate utility; robust age norms are sparse | Velocity chasing | Internal percentile only by org/team if desired |
| Softball | Windmill pitching velocity | Performance marker for pitchers | Practice with radar | Monthly | Moderate utility; evidence base focuses more on load/injury than norms citeturn18search8turn18search11turn18search17 | Strong misuse risk | Pair with exposure, pain, recovery |
| Softball | Strike percentage / first-pitch strike | Developmentally useful command metric | Practice/game | Weekly | Strong practical value citeturn49view0turn50search1 | Using command alone to overload pitchers | Link to recent workload |
| Softball | Innings, pitches, consecutive days | Key durability context | Practice/game | Every outing | Moderate expert-consensus support; not formalized like baseball citeturn49view0turn24search2turn18search20 | False sense of precision | Guidance + alerts, not hard medical claims |
| Softball | Catcher innings / games | Important exposure proxy | Game/practice | Every outing | Weak evidence but high practical relevance | Ignored cumulative load | Include in workload dashboard |
| Softball | Hip / shoulder mobility screen | Relevant to windmill mechanics and pain trends | Practice or trainer screen | Monthly | Moderate support citeturn50search0turn50search2 | Poor home reliability | Use trainer/coach rubric or simple pass/fail |

### Hidden and underused traits worth tracking

| Trait | Why it matters | Simple measure | Appropriate ages | Frequency | Action if flagged |
|---|---|---|---|---|---|
| Single-leg balance | Cheap motor-control and asymmetry screen | Timed barefoot balance | 8–15 | Monthly | Reduce complexity; add balance/core block |
| Hop-and-stick control | Captures deceleration and landing quality | 3 hops each leg, soft landing hold | 8–15 | Monthly | Lower plyometric volume; coach landing mechanics |
| Landing noise / softness | Simple proxy for force acceptance | Coach/parent 3-point rubric | 8–15 | Monthly | Add landing and squat patterns before more jumping |
| Knee valgus tendency | Relevant to cutting/landing mechanics | Front-view phone video on jump/land | 10–15 | Monthly | Add neuromuscular warm-up and single-leg strength |
| Ankle mobility | Affects sprinting, squatting, landings | Knee-to-wall difference side to side | 8–15 | Monthly | Add calf/ankle mobility and landing drills |
| Hip rotation mobility | Key for throwing/hitting power transfer | Simple seated rotation or 90/90 screen | 10–15 | Monthly | Reduce volume if painful; mobility + core block |
| Thoracic rotation | Important for throwing/hitting and defensive movement | Half-kneeling or seated rotation screen | 8–15 | Monthly | Add thoracic mobility; avoid forcing range |
| Shoulder pain-free ROM | Essential in throwers | Pain-free reach, ER/IR screen if trained evaluator | 10–15 | Weekly to monthly | If painful, cut throwing and prompt professional review |
| Grip asymmetry | Can reflect strength imbalance or fatigue in throwers | Dynamometer | 10–15 | Monthly | Recheck after recovery; add arm care |
| Reaction time | Useful but secondary | Ruler drop or app | 8–15 | Monthly | Keep as game-like fun metric, not as a selection filter |
| Confidence / self-efficacy | Coach feedback and skill confidence influence performance | One-item check (“I feel ready/confident”) | 8–15 | Weekly | Coach follow-up; avoid public comparison |
| Enjoyment / burnout risk | Retention and long-term development | Two-item fun and stress check | 8–15 | Weekly | Reduce volume, rotate routines, push variety |
| Warm-up compliance | Highly actionable safety behavior | Yes/no plus completion % | 8–15 | Every session | Nudge parent/coach; escalate if persistent |
| Multi-sport participation | Protective LTAD context | Sports played this season, months per year | 8–15 | Seasonal | Display as context, never as penalty |

The less obvious traits above matter because youth injury risk is not only about how hard a child can sprint or throw. It is also about how they absorb force, how they recover, whether they are in a rapid-growth phase, whether they are showing pain, whether their routine has become monotonous, and whether they still enjoy the sport. The platform should treat these as **decision support** inputs, not as talent-identification scores. citeturn17search1turn17search11turn17search15turn33search1turn52search14turn52search15

## Benchmarks and Evidence Boundaries

### How benchmarks should be handled

The benchmark policy should be strict:

1. **Hard-code only benchmarks with strong or moderate evidence and clear protocols.**
2. **Treat device-specific numbers as local norms unless a strong youth reference exists.**
3. **Default to within-player trend charts whenever the literature is weak.**
4. **Store benchmark confidence and source citations in the data model so the UI can tell the truth about uncertainty.** citeturn15view0turn53search3turn53search5turn38view0

### Benchmark table

| Metric | Age band | Usable benchmark or guidance | Evidence quality | Platform rule |
|---|---|---|---|---|
| Baseball pitch count and rest | 8–9 | Daily max 50; 1–20 pitches same-day rest, 21–35 = 1 day, 36–50 = 2 days | Strong / official guidance citeturn46view1 | Hard-code |
| Baseball pitch count and rest | 10–11 | Daily max 75; 1–20 same day, 21–35 = 1 day, 36–50 = 2 days, 51–65 = 3 days, 66+ = 4 days | Strong / official guidance citeturn46view1turn46view0 | Hard-code |
| Baseball pitch count and rest | 12–13 | For 11–12: daily max 85 with 66+ = 4 days; for 13–14: daily max 95 with 66+ = 4 days | Strong / official guidance citeturn46view1turn47view1 | Hard-code by exact age |
| Baseball pitch count and rest | 14–15 | For 13–14: daily max 95; for 15–16: daily max 95 but rest thresholds shift to 1–30, 31–45, 46–60, 61–75, 76+ | Strong / official guidance citeturn47view1turn46view2 | Hard-code by exact age |
| Baseball annual throwing rest | 9–12 | Do not exceed 80 innings/year; at least 4 months off throwing, 2–3 continuous | Strong / official guidance citeturn46view0 | Hard-code reminders |
| Baseball annual throwing rest | 13–18 | Do not exceed 100 innings/year; at least 4 months off competitive pitching, 2–3 continuous months off all overhead throwing | Strong / official guidance citeturn47view1turn46view2 | Hard-code reminders |
| Baseball pitching velocity, male sample | 10–11 | Mean ≈ 52.6 ± 3.2 mph in an 11U youth pitcher sample | Moderate; cross-sectional sample, not universal norm citeturn28view2 | Show as optional context only |
| Baseball pitching velocity, male sample | 12–13 | Mean ≈ 55.4 ± 6.8 mph in a 13U youth pitcher sample | Moderate citeturn28view2 | Optional context only |
| Baseball pitching velocity, male sample | 14–15 | Mean ≈ 67.0 ± 4.5 mph in a 15U youth pitcher sample | Moderate citeturn28view2 | Optional context only |
| Baseball 10 m sprint, male sample | 10–11 | Mean ≈ 2.32 ± 0.16 s | Moderate; pitcher sample only citeturn28view2 | Optional context only |
| Baseball 10 m sprint, male sample | 12–13 | Mean ≈ 2.24 ± 0.12 s | Moderate citeturn28view2 | Optional context only |
| Baseball 10 m sprint, male sample | 14–15 | Mean ≈ 2.10 ± 0.15 s | Moderate citeturn28view2 | Optional context only |
| Baseball vertical jump, male sample | 10–11 | Mean ≈ 29.6 ± 4.9 cm | Moderate; sample-specific citeturn28view2 | Optional context only |
| Baseball vertical jump, male sample | 12–13 | Mean ≈ 29.8 ± 4.5 cm | Moderate citeturn28view2 | Optional context only |
| Baseball vertical jump, male sample | 14–15 | Mean ≈ 31.5 ± 11.0 cm | Moderate; wide SD citeturn28view2 | Handle as noisy |
| Female baseball pitching velocity sample | 10–11 | Mean ≈ 39.1 ± 3.7 mph in a small 11U female baseball sample | Weak-to-moderate; small sample, baseball not softball citeturn28view1 | Do not use as softball default |
| Female baseball pitching velocity sample | 12–13 | Mean ≈ 47.0 ± 5.4 mph | Weak-to-moderate citeturn28view1 | Context only |
| Female baseball pitching velocity sample | 14–15 | Mean ≈ 53.2 ± 7.6 mph | Weak-to-moderate citeturn28view1 | Context only |
| Softball pitcher workload | Under 13 | Expert-guidance suggestion: not >7 innings/game, not >12 innings/day, not >2 consecutive days; ideally 1–2 days rest after bigger loads | Moderate-to-weak; expert consensus, not universal rule citeturn49view0turn18search8turn18search20 | Guidance alerts, not hard lockouts |
| Softball pitcher workload | 13 and older | Expert-guidance suggestion: not >3 consecutive days; ideally 2 days rest after pitching | Moderate-to-weak citeturn49view0turn18search8 | Guidance alerts |
| Basketball sprint / agility / power | All age bands | Older and more mature players tend to perform better in speed, sprint, centripetal-force, and many power measures, while technical outcomes are more training-dependent and variable | Moderate; trend-level evidence better than universal numbers citeturn38view0turn32search15 | Use local/team norms + within-player trends |
| General youth physical-fitness percentiles | 8–15 | Large European/French reference datasets exist for standing long jump, shuttle-based fitness, and Eurofit-style testing, but exact percentiles should be imported from the primary tables rather than retyped from secondary websites | Moderate-to-strong reference existence; do not hard-code without verified tables citeturn53search3turn53search5turn15view0 | Admin-import benchmark library |

### What should not be hard-coded as universal youth benchmarks

The strongest evidence gaps in this review were **basketball shooting percentages by age**, **baseball and softball exit velocity by age**, **softball windmill pitch velocity by exact age band**, **home-to-first or base-running times as universal norms**, and **catcher workload thresholds**. The product should explicitly support these as **local benchmarks** or **within-player trend metrics**, but it should not pretend there is a strong universal youth standard when the literature is thin or device-specific. That is a feature, not a weakness: the interface should tell coaches and parents when a metric is “internal trend only.” citeturn38view0turn32search15turn18search8turn18search11turn18search17

## Evaluation Cycle and At-Home Routines

### Recommended evaluation cycle

A good evaluation calendar minimizes noise and anxiety. Daily measures should focus on well-being and exposure. Monthly measures should focus on low-cost physical and skill tests. Full resets should happen every 8–12 weeks and seasonally.

| Cadence | Recommended fields | Platform notes |
|---|---|---|
| Daily or per session | Sleep, soreness, pain, energy/readiness, session RPE, attendance/participation, throwing or pitching volume, minutes, notes | Keep check-in under 60 seconds; pain should trigger branch logic immediately citeturn35search1turn34search0turn21view0turn49view0 |
| Weekly | Routine completion, weekly throwing volume, basketball shooting volume, softball/baseball innings, missed warm-ups, coach notes, fun/stress check | Weekly review should feed parent and coach summary cards citeturn52search14turn17search13 |
| Monthly | 10 m sprint, broad jump or vertical jump, COD drill, single-leg balance/hop-and-stick, mobility screen, sport-specific skill tests, radar-based velocity if available | Same day, same warm-up, same surface, same footwear if possible citeturn15view0turn27view0 |
| Every 8–12 weeks | Full evaluation, trend review, growth review, benchmark refresh, routine progression, durability review | This is the main planning checkpoint |
| Preseason / midseason / postseason | Baseline, season review, offseason plan | Make postseason reports simple enough for parents and actionable enough for coaches |

The metrics that should **not** be tested too often are max throwing velocity, max pitch velocity, exit velocity, repeated all-out jump testing, and body-mass/body-composition data. For many youth athletes these are noisy, easy to chase, and can distort training behavior. In particular, baseball and softball velocity should usually be tested monthly at most, and only when the athlete is healthy and reasonably fresh. citeturn48search0turn21view0turn49view0turn50search1

### At-home routine design rules

At-home routines should be short, safe, and boring in the right way. For this age range, routines should emphasize **movement quality, repetition, consistency, and compliance**, not exhaustion. The platform should store for each routine: level, intended session length, equipment, drill list, coaching points, stop rules, progression rules, and completion quality. This matches pediatric and LTAD guidance that youth training should be age-appropriate, supervised when possible, and aimed at long-term development rather than maximal fatigue. citeturn0search1turn51search3turn51search1turn19search2

### Basketball routine library

**Beginner basketball routine, 10–15 minutes, 2–3 times per week**

1. Ball taps or waist circles, 30 seconds  
2. Stationary pound dribbles right/left, 20 seconds each  
3. Figure-8 dribble, 30 seconds  
4. Split-stance passing to wall or target, 10 each side  
5. Form shooting close to basket or wall target, 10–20 makes  
6. Jump-stop to soft landing, 6 reps  
7. Single-leg balance, 20 seconds each side  
8. Calf/ankle mobility + deep squat hold, 30 seconds each  

Track: completed yes/no, ball-control difficulty, form-shooting makes/attempts, pain yes/no, session RPE.

**Intermediate basketball routine, 15–20 minutes, 3 times per week**

1. Alternating crossover / between-legs sequence, 3 × 20 seconds  
2. Cone or chair attack footwork, 4 reps each side  
3. Passing accuracy to wall target, 20 total  
4. Form-to-range shooting ladder, 25 total shots  
5. Lateral shuffle to stick, 3 each side  
6. Snap-down to jump-stop landing, 6 reps  
7. Side plank or dead bug, 2 × 20–30 seconds  
8. Hip and thoracic mobility, 2 minutes total  

Track: drill errors, shooting chart, landing quality rubric, completion quality.

**Advanced basketball routine, 20–25 minutes, 3–4 times per week**

1. Reactive ball-handling combo, 4 × 20 seconds  
2. Change-of-direction footwork with visual cue, 6 reps  
3. Quick-release shooting from 3–5 spots, 30–40 shots  
4. Defensive shuffle + closeout + stick, 6 reps  
5. Rebound jump + controlled landing, 6 reps  
6. Anti-rotation core, 2 sets  
7. Hip/ankle mobility finisher, 2 minutes  

Do not perform this version on days with knee pain, marked soreness, or after unusually heavy game/tournament loads. Neuromuscular control and landing work are the point. Volume is secondary. citeturn17search1turn17search15turn30search8

### Baseball routine library

**Beginner baseball routine, 10–15 minutes, 2–3 times per week**

1. Scapular wall slides or Y/T/W patterns, 8–10 reps  
2. Band or towel external-rotation prep, 8–10 reps  
3. Quadruped thoracic rotation, 6 each side  
4. Split-squat isometric hold, 20 seconds each side  
5. A-skip or wall march sprint drill, 2 × 10 m  
6. Fielding ready-position footwork, 6 reps  
7. Dry swing mechanics or contact-point drill, 10–15 reps  

Track: arm-care completion, soreness during/after, throwing done today yes/no.

**Intermediate baseball routine, 15–20 minutes, 3 times per week**

1. Arm-care microcircuit, 2 rounds  
2. Hip mobility + adductor rockback, 1–2 minutes  
3. Rotational power drill with light med ball or towel pattern, 6 each side  
4. Pogo hops or low-level jump series, 10–15 reps  
5. 10 m sprint mechanics, 3 reps  
6. Throwing accuracy to stationary target, 10–15 throws if pain-free  
7. Dry swings or tee work, 10–20 reps  

Track: throws completed, target hits, pain, RPE.

**Advanced baseball routine, 20–25 minutes, 3–4 times per week**

1. Full arm-care sequence, 2 rounds  
2. Mobility and cuff/scap prep, 3 minutes  
3. Rotational power block, 2 sets  
4. Lower-body power block, 2 sets  
5. Short acceleration sprint, 4–6 reps  
6. Infield/outfield footwork pattern or quick-transfer drill, 6–10 reps  
7. Hitting prep or tee sequence, 15–25 swings  

Do not assign on acute shoulder/elbow pain days, during formal pitching rest windows, or immediately after heavy pitching exposure. Baseball research and safety guidance are clear that fatigue and overuse dominate the risk picture. citeturn48search0turn21view0turn46view1turn46view0turn47view1turn46view2

### Softball routine library

**Beginner softball routine, 10–15 minutes, 2–3 times per week**

1. Scapular activation / band pull-aparts or towel pulls, 8–10 reps  
2. Hip openers and thoracic rotation, 2 minutes  
3. Split-stance throw pattern shadow reps, 8 each side  
4. Glute bridge or mini squat, 8–10 reps  
5. Wall-march sprint drill, 2 × 10 m  
6. Fielding stance and first-step drill, 6 reps  
7. Dry swing or tee mechanics, 10–15 reps  

**Intermediate softball routine, 15–20 minutes, 3 times per week**

1. Arm-care and shoulder-blade circuit, 2 rounds  
2. Hip mobility and adductor prep, 2 minutes  
3. Rotational pattern drill, 6–8 reps  
4. Low-level jump and stick, 6 reps  
5. 10 m sprint, 3–4 reps  
6. Throwing accuracy or pitch-command block if pain-free, 10–15 reps  
7. Tee or front-toss prep, 15–20 swings  

**Advanced softball routine, 20–25 minutes, 3–4 times per week**

1. Full arm-care sequence, 2 rounds  
2. Hip/shoulder mobility finisher, 3 minutes  
3. Pitching-specific movement care or drive-leg mechanics shadow work, 6–10 reps  
4. Rotational power drill, 2 sets  
5. Acceleration or base-running starts, 4–6 reps  
6. Throwing or command station, 12–20 reps if healthy  
7. Hitting prep, 20–25 swings  

If the athlete is a pitcher, the platform should ask one extra question before assigning the routine: **“Did you pitch recently, do you have pain, and do you feel arm/shoulder fatigue?”** Softball evidence shows pain and fatigue rise with exposure, and current workload guidance is still less formalized than baseball, which means the platform should be extra conservative. citeturn49view0turn50search1turn18search8turn18search17

## Software Platform Plan

### Personas and roles

| Role | What they need most |
|---|---|
| Platform admin | Tenant management, feature flags, privacy settings, benchmark library, audit trail |
| Organization admin | Teams, seasons, coaches, evaluators, role permissions, benchmark overrides |
| League admin | Organization-level reporting, compliance dashboards, safety review |
| Team coach | Rosters, daily check-ins, workload view, monthly evals, routines, reports |
| Assistant coach | Limited entry and review rights |
| Parent / guardian | Readiness check-ins, home routine guidance, alerts, progress summaries |
| Player | Simple dashboard, assigned routines, personal trends, encouragement, not rankings |
| Evaluator / trainer | Baselines, mobility/control screens, benchmark configuration suggestions |

The core workflow should be: create player -> assign team and season -> baseline evaluation -> enable daily readiness -> log sessions and workload -> assign routines -> run monthly check-ins -> auto-generate reports -> escalate safety flags. That is enough for a strong MVP. It is also the cleanest way to support multiple organizations, seasons, teams, and sports without overbuilding on day one. fileciteturn0file0

### Core objects and recommended schema

| Object | Must-have fields |
|---|---|
| Organization | id, name, timezone, featureFlags |
| Team | id, organizationId, sport, sexCategory, level, seasonId, coachIds |
| Season | id, organizationId, name, startDate, endDate |
| Player | id, organizationId, preferredName, DOB, sexAtBirth, guardianIds, sports, positions, dominantHand, dominantFoot, activeStatus |
| Guardian | id, contact info, consent flags |
| Coach | id, org/team memberships, permissions |
| Sport | id, name, metricDefinitionIds |
| MetricDefinition | id, code, name, sportScope, domain, unit, captureDifficulty, measurementProtocol, benchmarkPolicy, confidenceLevel, safetyWarning, retestIntervalDays |
| Evaluation | id, playerId, evaluatorId, evaluationType, date, notes |
| Measurement | id, evaluationId or sessionId, metricDefinitionId, valueNumber/valueText, protocolVersion, context, enteredByRole |
| ReadinessCheck | id, playerId, date, sleep, soreness, painFlags, energy, mood, notes |
| WorkloadEntry | id, playerId, date, sport, sessionType, minutes, sessionRPE, throws, pitches, innings, jumpsOptional, notes |
| TrainingPlan | id, playerId or teamId, goalWindow, focusAreas |
| Routine | id, sport, level, durationMin, equipment, stopRules, progressionRules |
| RoutineAssignment | id, routineId, playerId, dueDates, frequency |
| RoutineCompletion | id, assignmentId, date, completed, quality, painDuring, RPE, notes |
| InjuryFlag | id, playerId, severity, bodyPart, source, status, escalatedToGuardian, escalatedToCoach |
| Goal | id, playerId, metricDefinitionId optional, targetType, targetValue, dueDate |
| Benchmark | id, metricDefinitionId, ageBand, sexScope, maturityScope, levelScope, sourceTitle, sourceCitation, confidence, lowerBound, midBound, upperBound, notes |
| Recommendation | id, triggerType, ruleCode, outputText, severity |
| Report | id, playerId or teamId, reportType, generatedAt, snapshotPayload |

### Metric model design

The metric model should be the heart of the system. Every metric needs metadata, not just a name and a number.

**Recommended `MetricDefinition` fields**

- `code`
- `display_name`
- `sport_scope` = universal / basketball / baseball / softball / multi
- `domain` = readiness / workload / physical / skill / movement / growth / safety
- `value_type` = integer / decimal / percent / boolean / enum / rubric / text
- `unit`
- `capture_difficulty` = home_easy / practice_easy / simple_equipment / advanced_optional
- `protocol_version`
- `benchmark_policy` = hard_coded / admin_imported / local_only / within_player_only
- `confidence_level` = strong / moderate / consensus / weak
- `age_min`, `age_max`
- `sex_scope`
- `maturity_scope`
- `requires_guardian_consent`
- `safety_warning`
- `recommended_retest_interval_days`
- `visible_to_player`
- `visible_to_parent`
- `visible_to_coach`
- `ranking_allowed` default false for pain, readiness, body mass, velocity in sub-elite youth contexts

This design solves a real product problem: the same app needs to handle highly reliable metrics like baseball pitch counts and much less settled metrics like softball pitch velocity or basketball shooting expectations. The product should know the difference. citeturn46view1turn49view0turn38view0turn53search3

### Dashboard requirements

**Player dashboard**

Show current goals, today’s readiness, assigned routines, last 30 days of trend lines, upcoming evaluation date, recent personal bests, and one encouraging coachable message. Do not show a public rank position. Show “internal trend only” tags where evidence is weak.

**Parent dashboard**

Show what to do this week, recent progress, routine completion, readiness alerts, pain flags, evaluation history, and coach comments. Translate internal jargon into parent language.

**Coach dashboard**

Show roster readiness, missed check-ins, pain flags, throwing/pitching rest status, routine compliance, monthly evaluation due list, and short player-development cards. The key coach question is always: *Who should I modify today?*

**Admin dashboard**

Show usage, completion rates, safety-flag counts, missing-consent issues, metric adoption, and benchmark-config coverage.

### Alerts and flag logic

The MVP alert engine should be simple and rules-based.

**Red alerts**
- Pain reported during throwing, pitching, jumping, or sprinting
- Repeated pain on consecutive days
- Baseball pitcher in required rest window but marked available
- Softball pitcher with repeated consecutive-day exposure plus pain or marked fatigue
- Any athlete checked as unable to participate

**Yellow alerts**
- Sharp negative change in readiness relative to own 7-day baseline
- Rapid recent height increase plus concurrent pain or performance drop
- Missed warm-up compliance for several sessions
- Throwing or pitching volume meaningfully above recent normal
- Routine non-compliance for 2+ weeks

**Blue informational flags**
- Monthly evaluation due
- Goal reset due
- Baseline missing
- Benchmark confidence low / local norm only

The alert engine should explain *why* a flag appeared and *what the next safe action is*. For youth users, that action should usually be “reduce load,” “retest later,” “notify guardian,” or “consult a qualified professional if symptoms persist.” It should never sound like a diagnosis. citeturn21view0turn48search0turn46view1turn49view0turn19search2

### Safety, ethics, and privacy requirements

The platform should be explicitly anti-harm in design:

- No public leaderboards for pain, readiness, body mass, or pitcher velocity in the youth product.
- No talent score, injury prediction score, or return-to-play score in MVP.
- Parent consent and age-appropriate privacy controls should be mandatory before data collection.
- Pain/injury workflows must point users toward qualified professionals when needed.
- The UI should frame development positively and emphasize effort, habits, and consistency.
- Maturation-aware caveats must appear anywhere benchmarks can unfairly favor early developers.
- Multi-sport participation should be treated as healthy context, not lack of commitment.
- The product should offer coach education snippets explaining why fatigue, growth, and pain matter. citeturn19search2turn52search14turn52search5turn0search1turn51search3

## Codex Implementation Brief

### MVP recommendation

Build this first:

1. Multi-tenant organizations, teams, seasons, players, guardians, coaches  
2. Baseline evaluation workflow  
3. Daily readiness check-ins  
4. Session and workload logging  
5. Routine library and assignments  
6. Monthly evaluation capture  
7. Player / parent / coach dashboards  
8. Rules-based alerts  
9. PDF or web monthly player reports  

Defer this:

- Markerless motion capture
- Wearable workload integrations
- Automated video biomechanics
- Probabilistic injury prediction
- Cross-organization benchmarking marketplace
- Scout-facing ranking features

Do not build initially:

- Public rankings
- AI-generated player talent grades
- Unverified benchmark auto-comparisons
- Medical or rehab recommendations
- Complex ACWR dashboards as if they are settled science; if workload analytics are included, they should be simple, transparent, and caveated. citeturn36search5turn36search4turn36search16

### Recommended tech stack assumptions

Use a conventional, boring stack:

- **Frontend:** Next.js + TypeScript + React
- **UI:** Tailwind + component library
- **Backend:** Next.js API routes or separate Node service
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Auth:** role-based auth with organization scoping
- **Validation:** Zod
- **Background jobs:** queue for report generation and alert evaluation
- **Storage:** object store for report exports and optional video uploads
- **Analytics:** product analytics separated from athlete data tables
- **Mobile plan:** responsive PWA first, native capture later

### Core pages

- `/login`
- `/select-org`
- `/org/:orgId/dashboard`
- `/org/:orgId/teams`
- `/team/:teamId`
- `/team/:teamId/readiness`
- `/team/:teamId/workload`
- `/player/:playerId`
- `/player/:playerId/evaluations`
- `/player/:playerId/routines`
- `/player/:playerId/reports`
- `/guardian/:guardianId/home`
- `/coach/tasks`
- `/admin/metric-definitions`
- `/admin/benchmarks`
- `/admin/routine-library`
- `/admin/alerts`
- `/admin/consents`

### Core API endpoints

- `POST /api/orgs`
- `POST /api/teams`
- `POST /api/players`
- `POST /api/guardians`
- `POST /api/evaluations`
- `POST /api/measurements`
- `POST /api/readiness-checks`
- `POST /api/workload-entries`
- `POST /api/routine-assignments`
- `POST /api/routine-completions`
- `GET /api/players/:id/dashboard`
- `GET /api/teams/:id/dashboard`
- `GET /api/reports/:id`
- `POST /api/alerts/recompute`
- `POST /api/benchmarks/import`

### Example seed metrics for MVP

- `sleep_hours`
- `soreness_score`
- `pain_any`
- `pain_throwing_arm`
- `energy_score`
- `session_rpe`
- `session_minutes`
- `height_cm`
- `body_mass_kg`
- `sprint_10m_s`
- `broad_jump_cm`
- `vertical_jump_cm`
- `single_leg_balance_s_left`
- `single_leg_balance_s_right`
- `ankle_knee_to_wall_cm_left`
- `ankle_knee_to_wall_cm_right`
- `basketball_ft_20_made`
- `basketball_spot_shooting_left_corner_made`
- `basketball_ballhandling_course_time_s`
- `baseball_pitch_count`
- `baseball_pitch_velocity_mph`
- `baseball_strike_pct`
- `baseball_throw_velocity_mph`
- `softball_pitch_velocity_mph`
- `softball_innings_pitched`
- `softball_consecutive_pitch_days`
- `softball_strike_pct`

### Example seed routines

- `basketball_beginner_ball_control_12m`
- `basketball_intermediate_landing_and_footwork_18m`
- `baseball_beginner_armcare_12m`
- `baseball_intermediate_accel_and_rotation_18m`
- `softball_beginner_armcare_and_hip_mobility_12m`
- `softball_intermediate_pitcher_recovery_15m`

### Example business rules

- If `pain_any = true`, require body part.
- If throwing-arm pain is reported, suppress throwing/pitching routine recommendations until reviewed.
- Baseball pitchers follow age-based required rest automatically.
- Softball pitchers receive yellow alerts on consecutive-day workloads and red alerts when pain/fatigue coexists with repeated exposure.
- Benchmark cards can only render if metric definition has a benchmark policy other than `within_player_only`.
- Any metric with `ranking_allowed = false` cannot appear in org or team leaderboards.
- Any player under guardian control cannot self-edit consent settings.

### Testing plan

- Unit tests for benchmark resolver
- Unit tests for alert rules
- Permission tests for every role
- Snapshot tests for player / parent / coach dashboards
- Seed-data integration tests across basketball, baseball, softball
- End-to-end tests for baseline -> daily check-in -> routine assignment -> monthly report
- Regression tests for baseball rest windows
- Regression tests for pain-trigger suppression of routines
- Report-generation tests for confidence labels and citation display

### Suggested phased roadmap

**MVP**
- Profiles, rosters, baselines, readiness, workload, routine assignments, monthly reports, alerts

**Second phase**
- Device-assisted entry, local benchmark import, bulk team testing workflows, better reports, optional video attachment

**Third phase**
- Mobile capture, organization benchmarking with confidence guards, evaluator workflows, external integrations, advanced but transparent recommendation rules

### Codex-ready implementation prompt

```text
Build an MVP web application for youth sports organizations that track player development for ages 8–15 across basketball, baseball, and softball.

Product goals:
- Multi-organization, multi-team, multi-season support
- Player profiles
- Guardian-linked accounts
- Baseline evaluations
- Daily readiness and soreness check-ins
- Session workload logging
- At-home routine assignment and completion
- Monthly evaluation reports
- Rules-based safety alerts
- Coach, parent, player, and admin dashboards

Use:
- Next.js
- TypeScript
- React
- PostgreSQL
- Prisma
- Zod
- Role-based authorization

Core roles:
- platform_admin
- org_admin
- league_admin
- team_coach
- assistant_coach
- guardian
- player
- evaluator

Core database entities:
- Organization
- Team
- Season
- Player
- Guardian
- Coach
- MetricDefinition
- Benchmark
- Evaluation
- Measurement
- ReadinessCheck
- WorkloadEntry
- Routine
- RoutineAssignment
- RoutineCompletion
- InjuryFlag
- Goal
- Report
- Recommendation

Important MetricDefinition fields:
- code
- sportScope
- domain
- unit
- valueType
- captureDifficulty
- protocolVersion
- benchmarkPolicy
- confidenceLevel
- ageMin
- ageMax
- sexScope
- maturityScope
- safetyWarning
- recommendedRetestIntervalDays
- rankingAllowed
- visibleToPlayer
- visibleToGuardian
- visibleToCoach

Seed metrics:
- sleep_hours
- soreness_score
- pain_any
- pain_throwing_arm
- energy_score
- session_rpe
- session_minutes
- height_cm
- body_mass_kg
- sprint_10m_s
- broad_jump_cm
- vertical_jump_cm
- single_leg_balance_s_left
- single_leg_balance_s_right
- ankle_knee_to_wall_cm_left
- ankle_knee_to_wall_cm_right
- basketball_ft_20_made
- basketball_ballhandling_course_time_s
- baseball_pitch_count
- baseball_pitch_velocity_mph
- baseball_strike_pct
- baseball_throw_velocity_mph
- softball_pitch_velocity_mph
- softball_innings_pitched
- softball_strike_pct

Seed routines:
- basketball_beginner_ball_control_12m
- basketball_intermediate_landing_and_footwork_18m
- baseball_beginner_armcare_12m
- baseball_intermediate_accel_and_rotation_18m
- softball_beginner_armcare_and_hip_mobility_12m
- softball_intermediate_pitcher_recovery_15m

Required pages:
- org dashboard
- team dashboard
- player profile
- baseline evaluation page
- daily readiness check-in page
- workload entry page
- routine library
- routine assignment page
- guardian dashboard
- coach task dashboard
- monthly report page
- admin metric definition page
- admin benchmark page
- alerts page

Required dashboard behavior:
- player dashboard shows goals, assigned routines, upcoming evaluation, trend cards
- guardian dashboard shows home priorities, alerts, evaluation history
- coach dashboard shows roster readiness, workload, missed check-ins, routine compliance
- admin dashboard shows adoption, completion, safety flags, benchmark coverage

Business rules:
- No public leaderboards for pain, readiness, body mass, or youth throwing velocity
- Pain entries trigger alerts and suppress unsafe routine suggestions
- Baseball pitchers must follow age-based rest windows
- Softball pitchers use warning alerts for consecutive-day exposure and pain/fatigue combinations
- Metrics can only render benchmark comparisons if benchmarkPolicy is not within_player_only
- Store benchmark confidence and source text with each benchmark
- Never present diagnosis or return-to-play decisions
- Use positive developmental language in the UI

Baseball rest rules:
- Age 9-10 daily max 75, rest thresholds 1-20 / 21-35 / 36-50 / 51-65 / 66+
- Age 11-12 daily max 85, same thresholds
- Age 13-14 daily max 95, same thresholds
- Age 15-16 daily max 95, thresholds 1-30 / 31-45 / 46-60 / 61-75 / 76+

MVP report outputs:
- monthly player summary
- parent weekly summary
- coach roster summary

Testing requirements:
- unit tests for alert engine
- integration tests for baseline -> readiness -> routine -> report flow
- authorization tests per role
- regression tests for baseball rest logic
- regression tests for pain-trigger logic
- seed data and demo org for all 3 sports

Implementation phases:
1. MVP with manual entry only
2. Add benchmark import and device-assisted entry
3. Add mobile-first capture and advanced recommendation rules

Do not build:
- AI talent scores
- injury prediction scores
- public rankings
- advanced biomechanics analysis
- medical advice workflows
```

## Appendices

### Measurement protocols for launch

These should be versioned and stored in the product.

| Metric | Simple protocol |
|---|---|
| 10 m sprint | Standard warm-up, 2–3 trials, same start position, same surface, best time recorded |
| Standing broad jump | Two or three attempts, feet together, best distance recorded, same footwear/surface |
| Vertical jump | Same measurement method every time; do not mix wall-touch and app/jump-mat values in one trend |
| Single-leg balance | Barefoot if possible, hands on hips, timer stops on major touch-down |
| Knee-to-wall ankle mobility | Heel stays down, distance from toe to wall recorded in cm |
| Free throws out of 20 | Standard warm-up, record makes and attempts only; do not compare across different ball sizes or hoop heights without context |
| Throwing/pitching velocity | Healthy, pain-free, standardized warm-up, limited max attempts, same radar location |
| Strike percentage | Fixed number of pitches to defined target zones, attempts stored with conditions |
| Pain check | Body part + simple severity score + “during activity?” toggle |

Testing should be conducted in a mastery-oriented climate with a consistent warm-up and valid conditions. FitBack’s testing guidance also emphasizes standardization, warm-up, and minimizing anxiety during youth testing, which aligns well with this product’s evaluation design. citeturn15view0

### Sample monthly player report structure

A useful player report should include:

- development snapshot
- readiness trend
- workload summary
- current pain flags
- updated personal bests
- benchmark confidence note
- coach priorities for the next month
- home routine schedule
- parent notes box
- “what changed since last month” section

### Sample coach dashboard summary

A useful coach dashboard card should answer, for every player:

- available / modify / hold
- recent pain yes/no
- last readiness score
- throwing/pitching rest status
- routine completion %
- overdue evaluation yes/no
- one next coaching priority

### Sample parent weekly summary

A useful parent summary should answer:

- how your child is doing
- what to do at home this week
- whether there are pain or fatigue concerns
- which routine was assigned
- whether anything needs coach follow-up

### Glossary

**Readiness:** a short self-report of how prepared the athlete feels to train or compete.  
**Session RPE:** a simple rating of how hard a session felt.  
**COD:** change of direction.  
**LTAD:** long-term athletic development.  
**PHV:** peak height velocity, the fastest period of adolescent growth.  
**Benchmark confidence:** the product’s confidence in whether an external norm is solid enough to compare against.  
**Within-player trend:** comparison against the same athlete’s prior results rather than a population norm.

### Open questions and limitations

The evidence is strongest for youth overuse prevention, baseball pitching workload, sleep/well-being monitoring, neuromuscular training, and general LTAD principles. It is much weaker for universal youth norms in basketball shooting skill, softball pitch speed by age, baseball and softball exit velocity by age, catcher workload, and game-readiness metrics that go beyond simple self-report. Those areas should remain configurable, local, and transparent until better evidence is available. citeturn46view1turn49view0turn35search1turn17search1turn51search3