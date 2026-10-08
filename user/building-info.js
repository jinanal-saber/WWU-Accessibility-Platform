// =====================================================================================
// Building info: the photo + accessibility details shown when a building marker is clicked.
//
// WHERE THIS COMES FROM: Western Washington University's own building pages
// (https://www.wwu.edu/buildings, and the residence hall pages on housing.wwu.edu). The
// accessibility lines are condensed from those pages without adding anything to them, and
// each popup links back to the full official page. Checked October 2026.
//
// PHOTOS are NOT copied into this project. Each "photo" is the address of the image on WWU's
// own website, so the browser loads it from wwu.edu. If WWU moves or removes a photo, or its
// server refuses to serve it to other sites, the popup hides the picture and still shows the
// text. Entries with "photo": null had no suitably sized photo on WWU's page.
//
// KEYS are WWU's building codes (the letters in brackets at the end of a building's name,
// e.g. "Miller Hall (MH)" -> "MH").
//
// TO UPDATE a building: edit its entry below. "accessibility" is a list of short lines.
// A line starting "NOT" or "No" is something people most need to see, so keep those.
// =====================================================================================

const WWU_BUILDING_INFO_CHECKED = "October 2026";

const WWU_BUILDING_INFO = {
    "AA": {
        "url": "https://www.wwu.edu/building/aa",
        "photo": "https://www.wwu.edu/sites/default/files/styles/large/public/2022-01/AA.jpg.webp?itok=QlWjmUDV",
        "photoAlt": "Art Annex, a windowless brick building with a large chimney",
        "accessibility": [
                "Accessible parking to the east",
                "Accessible entrance: a manual (not button-activated) accessible entrance on the west side",
                "No accessible restrooms are provided",
                "Only the basement is wheelchair accessible"
        ],
        "genderNeutral": "AA 266",
        "note": null,
        "source": "Western Washington University"
    },
    "AB": {
        "url": "https://www.wwu.edu/building/ab",
        "photo": "https://www.wwu.edu/sites/default/files/styles/large/public/2022-01/AB.jpg.webp?itok=uz0-rUJl",
        "photoAlt": "Archives building, a single-story brick building with large floor to ceiling windows looking out on a grass lawn.",
        "accessibility": [
                "Accessible entrance: a button-activated entrance on the east side",
                "An accessible restroom on the first floor",
                "An elevator serves both floors",
                "Accessible parking to the east"
        ],
        "genderNeutral": "AB 204, 208",
        "note": null,
        "source": "Western Washington University"
    },
    "AC": {
        "url": "https://www.wwu.edu/building/ac",
        "photo": "https://www.wwu.edu/sites/default/files/styles/large/public/2022-01/AC.jpg.webp?itok=Rfq4bM_N",
        "photoAlt": "Administrative Services Center, a two story, brick building, with a short overhang over the entry way and front double glass doors.",
        "accessibility": [
                "Accessible parking to the west",
                "Accessible entrances on the west side of the building",
                "Accessible restrooms on all floors",
                "Elevator to all floors"
        ],
        "genderNeutral": null,
        "note": "Located off campus at 333 32nd Street. A parking permit is required in lot 32G Monday through Friday.",
        "source": "Western Washington University"
    },
    "AH": {
        "url": "https://www.wwu.edu/building/ah",
        "photo": "https://www.wwu.edu/sites/default/files/styles/large/public/2022-01/Arntzen.jpg.webp?itok=ajnfH3Jz",
        "photoAlt": "Arntzen Hall, a concrete building with floor to ceiling glass on the first floor.",
        "accessibility": [
                "Accessible entrances: button-activated entrances on the west side",
                "Elevators provide access to all levels",
                "Accessible restrooms on the Concourse level (basement)",
                "Access to the Environmental Studies building through the basement connection",
                "Accessible parking to the east (Lot 17 G)"
        ],
        "genderNeutral": null,
        "note": null,
        "source": "Western Washington University"
    },
    "AI": {
        "url": "https://www.wwu.edu/building/ai",
        "photo": "https://www.wwu.edu/sites/default/files/styles/large/public/2022-01/Academic%20Instructional%20Center.jpg.webp?itok=TeUHlQFp",
        "photoAlt": "Academic Instruction Center, a modern square building with three floors and floor-to-ceiling windows on three sides",
        "accessibility": [
                "Accessible parking to the east and west of the building",
                "Accessible entrances: button-activated entrances on the north and east sides",
                "Accessible restrooms on each floor",
                "Both elevators serve all floors",
                "Academic Instructional Center West is reachable via the 4th-floor sky-bridge"
        ],
        "genderNeutral": "See Academic Instructional Center West",
        "note": null,
        "source": "Western Washington University"
    },
    "AW": {
        "url": "https://www.wwu.edu/building/aw",
        "photo": "https://www.wwu.edu/sites/default/files/styles/large/public/2022-01/Academic%20West.jpg.webp?itok=Ad12Vzqn",
        "photoAlt": "Academic West, which has a brick first floor with an overhanging second and third story both with floor to ceiling windows",
        "accessibility": [
                "Accessible parking to the east and west of the building",
                "Accessible entrances: button-activated entrances on the north and east sides",
                "Accessible restrooms on each floor",
                "Both elevators serve all floors",
                "The two Academic Instructional buildings are connected by a 4th-floor sky-bridge"
        ],
        "genderNeutral": "AW 411",
        "note": null,
        "source": "Western Washington University"
    },
    "BH": {
        "url": "https://www.wwu.edu/building/bh",
        "photo": "https://www.wwu.edu/sites/default/files/styles/large/public/2022-01/Bond%20in%20fall.jpg.webp?itok=pT_N0fgI",
        "photoAlt": "Bond Hall, a five story brick building on a brick plaza with trees in the foreground.",
        "accessibility": [
                "Accessible entrances: button-activated entrances on the northeast side",
                "An elevator reaches all floors except the 2nd and 3rd half floors (both half floors are reachable by ramps or lifts)",
                "Accessible restrooms on the Mezzanine level",
                "Many doors in this building are 2 ft 8 in wide",
                "Accessible parking to the east or west"
        ],
        "genderNeutral": "BH 157, 207, 307, 403B",
        "note": null,
        "source": "Western Washington University"
    },
    "BI": {
        "url": "https://www.wwu.edu/building/bi",
        "photo": "https://www.wwu.edu/sites/default/files/styles/large/public/2022-01/Biology.jpg.webp?itok=MsDD27sd",
        "photoAlt": "The Biology Building, a three story white stone building located on a brick plaza.",
        "accessibility": [
                "Accessible entrance: a button-activated entrance on the northeast corner",
                "Accessible restrooms on floors 2-5",
                "An elevator provides access to all levels",
                "The Chemistry Building is reachable via a 4th-floor sky bridge",
                "Accessible parking to the east or south"
        ],
        "genderNeutral": null,
        "note": null,
        "source": "Western Washington University"
    },
    "BT": {
        "url": "https://housing.wwu.edu/life-on-campus/buchanan-towers",
        "photo": "https://housing.wwu.edu/sites/housing.wwu.edu/files/styles/image_block_large/public/2024-11/IMG_0005.jpg?itok=R-ao4P30",
        "photoAlt": "Buchanan Towers",
        "accessibility": [
                "Both Buchanan Towers and Buchanan Towers East are ADA accessible buildings with elevators throughout",
                "Accessible entrances on the north and south sides",
                "Accessible restrooms in the main lounge on the 1st floor",
                "Resident parking: lot 1R (permit required), ADA accessible"
        ],
        "genderNeutral": "351 & 352",
        "note": null,
        "source": "WWU University Residences"
    },
    "CA": {
        "url": "https://www.wwu.edu/building/ca",
        "photo": "https://www.wwu.edu/sites/default/files/styles/large/public/2022-01/CA.jpg.webp?itok=72IKmjkf",
        "photoAlt": "Canada House, a two-story house painted dark green, with US and Canadian flags flying next to it.",
        "accessibility": [
                "Accessible entrance: a button-activated entrance on the east side",
                "Only the first floor is wheelchair accessible",
                "An accessible restroom on the first floor",
                "Accessible parking to the south (Lot 11G)"
        ],
        "genderNeutral": "CA 105, 204",
        "note": null,
        "source": "Western Washington University"
    },
    "CB": {
        "url": "https://www.wwu.edu/building/cb",
        "photo": "https://www.wwu.edu/sites/default/files/styles/large/public/2022-01/Chemistry.jpg.webp?itok=Mb6F2ILB",
        "photoAlt": "Morse Hall, a three story glass building with a glass awning in front.",
        "accessibility": [
                "Accessible entrance: a button-activated entrance on the northeast corner",
                "Accessible restrooms on all floors",
                "An elevator provides access to all floors",
                "The Biology building is reachable via the 4th-floor foot bridge",
                "Accessible parking to the east"
        ],
        "genderNeutral": null,
        "note": null,
        "source": "Western Washington University"
    },
    "CF": {
        "url": "https://www.wwu.edu/building/cf",
        "photo": "https://www.wwu.edu/sites/default/files/styles/large/public/2022-01/CF.jpg.webp?itok=Ck-VzJZA",
        "photoAlt": "Communications Facility, a four story building with a brick and rusted metal facade",
        "accessibility": [
                "Accessible entrances: button-activated entrances on the east and west sides",
                "Accessible restrooms on all floors",
                "Centrally located elevators provide access to all floors",
                "Accessible parking to the east (Lot 17 G)"
        ],
        "genderNeutral": "CF 157",
        "note": null,
        "source": "Western Washington University"
    },
    "CG": {
        "url": "https://housing.wwu.edu/life-on-campus/glass-kappa",
        "photo": "https://housing.wwu.edu/sites/housing.wwu.edu/files/styles/image_block_large/public/2024-11/CG_0.jpg?itok=DAgMzEv1",
        "photoAlt": "Alma Clark Glass Hall",
        "accessibility": [
                "ADA accessible building",
                "Elevator access throughout",
                "Accessible entrances",
                "Accessible restrooms throughout",
                "Resident parking: lot 15R (permit required), ADA accessible"
        ],
        "genderNeutral": "168, 169, 445 & 447",
        "note": null,
        "source": "WWU University Residences"
    },
    "CH": {
        "url": "https://www.wwu.edu/building/ch",
        "photo": "https://www.wwu.edu/sites/default/files/styles/large/public/2022-01/CH.jpg.webp?itok=1rirC5bW",
        "photoAlt": "College Hall, a three story brick building with a terra-cotta roof.",
        "accessibility": [
                "Accessible entrances: button-activated entrances on the northeast and southwest sides",
                "The west entrance only gives access to rooms 133 (Journalism Lab), 135, 137 (Klipsun) and 141 (Western View)",
                "A wheelchair lift provides access to the second and third floors",
                "Accessible restrooms on the second floor"
        ],
        "genderNeutral": "CH 108A, 130",
        "note": null,
        "source": "Western Washington University"
    },
    "CM": {
        "url": "https://www.wwu.edu/building/cm",
        "photo": "https://www.wwu.edu/sites/default/files/styles/large/public/2022-01/cm.jpg.webp?itok=wonb592H",
        "photoAlt": "Commissary, a single-story brick warehouse building.",
        "accessibility": [
                "Accessible entrance: a button-activated entrance on the west side",
                "An accessible restroom on the ground floor",
                "Accessible parking to the west (Lot 22G)"
        ],
        "genderNeutral": "CM 103",
        "note": null,
        "source": "Western Washington University"
    },
    "CS": {
        "url": "https://www.wwu.edu/building/cs",
        "photo": "https://www.wwu.edu/sites/default/files/styles/large/public/2022-01/CS.jpg.webp?itok=EMxFO3o1",
        "photoAlt": "Campus Services building",
        "accessibility": [
                "Accessible entrance: a button-activated entrance on the north side",
                "Accessible restrooms on the ground floor",
                "An elevator provides access to all floors",
                "Accessible parking to the north (Lot 23 V)"
        ],
        "genderNeutral": "CS 102, 103, 127, 128",
        "note": null,
        "source": "Western Washington University"
    },
    "CV": {
        "url": "https://www.wwu.edu/building/cv",
        "photo": "https://www.wwu.edu/sites/default/files/styles/large/public/2022-01/Carver%20summer.jpg.webp?itok=pja0YAr_",
        "photoAlt": "Carver, a modern, glass-covered building with an LED screen reading \"Go Vikings!\"",
        "accessibility": [
                "Accessible entrances: button-activated entrances on the northeast and southwest sides",
                "An accessible manual entrance on the southeast side",
                "Only the ground floor is accessible",
                "Accessible restrooms in the southeast corridor and the locker rooms",
                "Some doors are 2 ft 10 in wide",
                "There are two elevators",
                "Accessible parking to the north of the building"
        ],
        "genderNeutral": "CV 111 (incl. shower & lockers), 226, 227, 309, 310, 311",
        "note": null,
        "source": "Western Washington University"
    },
    "EH": {
        "url": "https://housing.wwu.edu/life-on-campus/edens-higginson",
        "photo": "https://housing.wwu.edu/sites/housing.wwu.edu/files/styles/image_block_large/public/2024-11/IMG_0312.jpg?itok=CV8PB7MC",
        "photoAlt": "Edens Hall",
        "accessibility": [
                "ADA accessible building",
                "Elevator access throughout",
                "Accessible entrances on the south and west sides",
                "Accessible restrooms on the first floor",
                "Resident parking: lot 3R (permit required), ADA accessible"
        ],
        "genderNeutral": "212A",
        "note": null,
        "source": "WWU University Residences"
    },
    "EN": {
        "url": "https://housing.wwu.edu/life-on-campus/edens-higginson",
        "photo": null,
        "photoAlt": "",
        "accessibility": [
                "Accessible entrance on the northwest side",
                "Only the 1st floor is currently wheelchair accessible; the elevator has been decommissioned due to safety issues",
                "No accessible restrooms",
                "Resident parking: lot 3R (permit required), ADA accessible"
        ],
        "genderNeutral": "None",
        "note": null,
        "source": "WWU University Residences"
    },
    "ES": {
        "url": "https://www.wwu.edu/building/es",
        "photo": "https://www.wwu.edu/sites/default/files/styles/large/public/2022-01/ES.jpg.webp?itok=RCc74EKp",
        "photoAlt": "Student walk past Environmental Studies, a five-story concrete building.",
        "accessibility": [
                "Accessible entrances: button-activated entrances on the north and south sides",
                "The west elevator reaches all floors, including split levels",
                "The east elevator only reaches whole levels",
                "Accessible restrooms on the ground floor",
                "Arntzen Hall is accessible from the ground floor",
                "Accessible parking to the east (Lot 17-G)"
        ],
        "genderNeutral": "ES 120, 521",
        "note": null,
        "source": "Western Washington University"
    },
    "ET": {
        "url": "https://www.wwu.edu/building/et",
        "photo": "https://www.wwu.edu/sites/default/files/styles/large/public/2022-01/Ross%20Engineering.jpg.webp?itok=MwJyf4ZI",
        "photoAlt": "Ross Engineering, a two-story concrete and brick building lined with ivy and trees.",
        "accessibility": [
                "Accessible entrance: a button-activated entrance on the north side",
                "The south entrance is NOT wheelchair accessible, despite the ramp",
                "An elevator provides access to all floors",
                "Accessible restrooms on floors 1 and 3",
                "Accessible parking to the south",
                "Accessible parking to the east (Lot 17G)"
        ],
        "genderNeutral": "Inside suite 204",
        "note": null,
        "source": "Western Washington University"
    },
    "FA": {
        "url": "https://www.wwu.edu/building/fa",
        "photo": "https://www.wwu.edu/sites/default/files/styles/large/public/2022-01/Fairhaven%20Academic.jpg.webp?itok=XgUolLG_",
        "photoAlt": "Fairhaven Academic, a three story wood building surrounded by trees overlooking a brick plaza.",
        "accessibility": [
                "Accessible entrances: button-activated entrances on the north and south sides",
                "Wheelchair access from the courtyard or from the parking lot on the north side",
                "An elevator reaches all floors, but a key is needed for the second-floor dining area (contact Fairhaven Dining Services at 650-6851)",
                "Accessible restrooms on the first and third floors",
                "College administrative offices are on the 3rd floor",
                "Accessible parking to the north and/or west"
        ],
        "genderNeutral": "FA 120",
        "note": null,
        "source": "Western Washington University"
    },
    "FI": {
        "url": "https://www.wwu.edu/building/fi",
        "photo": "https://www.wwu.edu/sites/default/files/styles/large/public/2022-01/Fine%20Arts.jpg.webp?itok=ZB4sLU-D",
        "photoAlt": "Stairs leading up to Fine Arts, a two story brick building.",
        "accessibility": [
                "Accessible entrances: a button-activated entrance on the northwest side",
                "An accessible manual entrance on the southwest side",
                "An elevator serves the first and second floors",
                "The third floor and basement are not wheelchair accessible",
                "Rooms 123, 125 and 125a are reachable by wheelchair lift",
                "Accessible restrooms on the first floor",
                "The first-floor computer lab at the north end is accessible",
                "Western Gallery: the northwest entrance is accessible",
                "Accessible parking to the southeast"
        ],
        "genderNeutral": "FI 126, 128",
        "note": null,
        "source": "Western Washington University"
    },
    "FR": {
        "url": "https://www.wwu.edu/building/fr",
        "photo": "https://www.wwu.edu/sites/default/files/styles/large/public/2022-01/FR.jpg.webp?itok=Is8gIQRY",
        "photoAlt": "Entrance to Fraser Hall, a single-story brick building.",
        "accessibility": [
                "Accessible entrance: a button-activated entrance on the west side",
                "There are no accessible restrooms in this building",
                "Accessible parking to the east (Lot 10G)"
        ],
        "genderNeutral": null,
        "note": null,
        "source": "Western Washington University"
    },
    "FX": {
        "url": "https://housing.wwu.edu/life-on-campus/fairhaven",
        "photo": "https://housing.wwu.edu/sites/housing.wwu.edu/files/styles/image_block_large/public/2024-11/50619412987_42ba344e49_o%20%282%29.jpg?itok=gVY5f9Lo",
        "photoAlt": "Fairhaven residence complex",
        "accessibility": [
                "The complex has 12 stacks: stacks 1-10 are NOT ADA accessible and have no elevators",
                "Stacks 11-12 are ADA accessible and have elevators",
                "The wheelchair entrance is through the main courtyard entrance",
                "An accessible restroom is in the stack 11 4th-floor TV lounge",
                "Resident parking: lot 18R (permit required), ADA accessible"
        ],
        "genderNeutral": "Stacks 1-10: floor 1; stack 11: floor 4",
        "note": null,
        "source": "WWU University Residences"
    },
    "HG": {
        "url": "https://housing.wwu.edu/life-on-campus/edens-higginson",
        "photo": null,
        "photoAlt": "",
        "accessibility": [
                "ADA accessible building",
                "Elevator access throughout",
                "Accessible entrances on the northwest and southeast sides",
                "Accessible restroom in the 1st-floor lounge",
                "Resident parking: lot 3R (permit required), ADA accessible"
        ],
        "genderNeutral": "172",
        "note": null,
        "source": "WWU University Residences"
    },
    "HH": {
        "url": "https://www.wwu.edu/building/hh",
        "photo": "https://www.wwu.edu/sites/default/files/styles/large/public/2022-01/Haggard.jpg.webp?itok=_z06gahG",
        "photoAlt": "A curved brick and glass building with a glass skybridge",
        "accessibility": [
                "Accessible entrances: button-activated entrances on the northwest, northeast and southeast sides",
                "The northeast entrance is under the Haggard Hall/Wilson Library sky-bridge",
                "Elevators provide access to all floors",
                "The elevator near High Street only serves classrooms on all floors, not the library",
                "The central elevator only connects floors 2 and 3 of the library",
                "Accessible restrooms on all floors",
                "The second-floor sky-bridge provides wheelchair access to Wilson Library",
                "Accessible parking on the southwest side of the building"
        ],
        "genderNeutral": null,
        "note": null,
        "source": "Western Washington University"
    },
    "HS": {
        "url": "https://www.wwu.edu/building/hs",
        "photo": "https://www.wwu.edu/sites/default/files/styles/large/public/2022-01/HS.jpg.webp?itok=QlaRt8uz",
        "photoAlt": "High Street Hall, a series of single story buildings with wood siding.",
        "accessibility": [
                "Accessible entrance: button-activated entrances in the courtyard",
                "There are no accessible restrooms in this building",
                "Accessible parking to the east (Lot 11G)"
        ],
        "genderNeutral": null,
        "note": null,
        "source": "Western Washington University"
    },
    "HU": {
        "url": "https://www.wwu.edu/building/hu",
        "photo": "https://www.wwu.edu/sites/default/files/styles/large/public/2022-01/Humanities.jpg.webp?itok=-haK6gZE",
        "photoAlt": "Humanities, a three story brick and concrete building.",
        "accessibility": [
                "Accessible entrances: button-activated entrances on the northeast and southeast sides",
                "An elevator provides access to floors 1-3",
                "Accessible restrooms on the second floor",
                "Accessible parking to the east (Lot 10G)"
        ],
        "genderNeutral": null,
        "note": null,
        "source": "Western Washington University"
    },
    "MA": {
        "url": "https://housing.wwu.edu/life-on-campus/mathes",
        "photo": "https://housing.wwu.edu/sites/housing.wwu.edu/files/styles/image_block_large/public/2024-11/Mathes.jpg?itok=wvKmi8fG",
        "photoAlt": "Mathes Hall",
        "accessibility": [
                "NOT an ADA accessible building",
                "Accessible entrance off Garden St",
                "Access up to the 8th floor only",
                "No accessible restrooms",
                "The computer lab and TV lounge on the 9th floor are not accessible",
                "Accessible parking: lot 6V (permit required)"
        ],
        "genderNeutral": "128A & 128B",
        "note": null,
        "source": "WWU University Residences"
    },
    "MH": {
        "url": "https://www.wwu.edu/building/mh",
        "photo": "https://www.wwu.edu/sites/default/files/styles/large/public/2022-01/Miller.jpg.webp?itok=G3fQoDNX",
        "photoAlt": "Miller Hall, a four story brick building, sits in a brick square with a large fountain in the center.",
        "accessibility": [
                "This building is fully ADA compliant",
                "Accessible entrances on the southeast and northwest sides",
                "Accessible parking on the southeast side"
        ],
        "genderNeutral": "MH 413",
        "note": null,
        "source": "Western Washington University"
    },
    "NA": {
        "url": "https://housing.wwu.edu/life-on-campus/nash",
        "photo": "https://housing.wwu.edu/sites/housing.wwu.edu/files/styles/image_block_large/public/2021-05/nash.jpg?itok=g2jGRY6q",
        "photoAlt": "Nash Hall front entrance on a clear day",
        "accessibility": [
                "ADA accessible building",
                "The wheelchair-accessible entrance is the side door facing High St",
                "The basement through floor 6 are wheelchair accessible",
                "Accessible restrooms on the 4th (women's) and 5th (men's) floors",
                "The computer lab on the 7th floor is not accessible",
                "Accessible parking: the turnaround on the south side"
        ],
        "genderNeutral": "Basement and 1st floor",
        "note": null,
        "source": "WWU University Residences"
    },
    "OM": {
        "url": "https://www.wwu.edu/building/om",
        "photo": "https://www.wwu.edu/sites/default/files/styles/large/public/2022-01/Old%20Main.jpg.webp?itok=bQTenVYu",
        "photoAlt": "Old Main, a large brick building, surrounded by fall colored trees.",
        "accessibility": [
                "Accessible parking to the east of the building",
                "Accessible entrances on the south and east sides",
                "Accessible restrooms on the 1st, 3rd and 5th floors",
                "The south elevator serves floors 1-4 and only Room 530 on the 5th floor",
                "The north elevator serves floors 2-4 and Rooms 560-587 on the 5th floor"
        ],
        "genderNeutral": "OM 100A, 100B, 567, and inside suites 200, 300 & 400",
        "note": null,
        "source": "Western Washington University"
    },
    "PA": {
        "url": "https://www.wwu.edu/building/pa",
        "photo": "https://www.wwu.edu/sites/default/files/styles/large/public/2022-01/PAC.jpg.webp?itok=82hFla4G",
        "photoAlt": "The Performing Arts Center sits behind a large, angular red sculpture.",
        "accessibility": [
                "Accessible parking on the southwest side of the building",
                "Accessible entrances (WWU's page gives no location details)",
                "Accessible restrooms (WWU's page gives no location details)"
        ],
        "genderNeutral": "PA 150A, 151A, 390",
        "note": null,
        "source": "Western Washington University"
    },
    "PH": {
        "url": "https://www.wwu.edu/building/ph",
        "photo": "https://www.wwu.edu/sites/default/files/styles/large/public/2022-01/Parks%20in%20spring.jpg.webp?itok=lCvBfgf4",
        "photoAlt": "Parks Hall, a white concrete building, sits behind several blossoming cherry trees.",
        "accessibility": [
                "Accessible parking to the south of the building",
                "Accessible entrances on the south, east and north sides",
                "Accessible restrooms on all floors in the central hallways"
        ],
        "genderNeutral": null,
        "note": null,
        "source": "Western Washington University"
    },
    "PP": {
        "url": "https://www.wwu.edu/building/pp",
        "photo": "https://www.wwu.edu/sites/default/files/styles/large/public/2022-01/Physical%20Plant.jpg.webp?itok=UQm68K4c",
        "photoAlt": "A single story wood and concrete building with a sign reading \"Physical Plant\"",
        "accessibility": [
                "Accessible parking to the west and south (Lot 24G)"
        ],
        "genderNeutral": "PP 214",
        "note": null,
        "source": "Western Washington University"
    },
    "RA": {
        "url": "https://housing.wwu.edu/life-on-campus/soda",
        "photo": null,
        "photoAlt": "",
        "accessibility": [
                "NOT an ADA accessible building",
                "No elevator",
                "Resident parking: lot 15R (permit required), ADA accessible"
        ],
        "genderNeutral": "1st floor",
        "note": null,
        "source": "WWU University Residences"
    },
    "RC": {
        "url": "https://housing.wwu.edu/life-on-campus/soda",
        "photo": null,
        "photoAlt": "",
        "accessibility": [],
        "genderNeutral": null,
        "note": "WWU's page for this building does not list accessibility details.",
        "source": "WWU University Residences"
    },
    "RD": {
        "url": "https://housing.wwu.edu/life-on-campus/soda",
        "photo": "https://housing.wwu.edu/sites/housing.wwu.edu/files/styles/image_block_large/public/2024-11/RD_1.jpg?itok=Aoe7f8DE",
        "photoAlt": "Ridgeway Delta",
        "accessibility": [
                "NOT an ADA accessible building",
                "No elevator",
                "Resident parking: lot 15R (permit required), ADA accessible"
        ],
        "genderNeutral": "2nd floor",
        "note": null,
        "source": "WWU University Residences"
    },
    "RK": {
        "url": "https://housing.wwu.edu/life-on-campus/glass-kappa",
        "photo": null,
        "photoAlt": "",
        "accessibility": [
                "NOT an ADA accessible building",
                "No elevator",
                "Resident parking: lot 15R (permit required), ADA accessible"
        ],
        "genderNeutral": "1st & 2nd floors",
        "note": null,
        "source": "WWU University Residences"
    },
    "RO": {
        "url": "https://housing.wwu.edu/life-on-campus/soda",
        "photo": null,
        "photoAlt": "",
        "accessibility": [
                "NOT an ADA accessible building",
                "No elevator",
                "Resident parking: lot 15R (permit required), ADA accessible"
        ],
        "genderNeutral": "2nd floor",
        "note": null,
        "source": "WWU University Residences"
    },
    "RS": {
        "url": "https://housing.wwu.edu/life-on-campus/soda",
        "photo": null,
        "photoAlt": "",
        "accessibility": [
                "NOT an ADA accessible building",
                "No elevator",
                "Resident parking: lot 15R (permit required), ADA accessible"
        ],
        "genderNeutral": "2nd floor",
        "note": null,
        "source": "WWU University Residences"
    },
    "SL": {
        "url": "https://www.wwu.edu/building/sl",
        "photo": "https://www.wwu.edu/sites/default/files/styles/large/public/2022-01/SMATE.jpg.webp?itok=btRGvHyg",
        "photoAlt": "SMATE, a two story glass-fronted building overlooking a lawn.",
        "accessibility": [
                "Accessible doors at the south and west entrances",
                "Accessible restrooms on all floors",
                "Accessible parking to the south"
        ],
        "genderNeutral": null,
        "note": null,
        "source": "Western Washington University"
    },
    "SV": {
        "url": "https://www.wwu.edu/building/sv",
        "photo": "https://www.wwu.edu/sites/default/files/styles/large/public/2025-01/Wade%20King%20student%20rec-YES.jpg.webp?itok=Df3A-raB",
        "photoAlt": "Modern university building with large windows, surrounded by cherry blossoms and evergreen trees.",
        "accessibility": [
                "Accessible parking to the northeast (Lot 19G)",
                "Accessible entrances on the east side",
                "Accessible restrooms on the main floor"
        ],
        "genderNeutral": "SV 110, 155, 156",
        "note": null,
        "source": "Western Washington University"
    },
    "VC": {
        "url": "https://www.wwu.edu/building/vc",
        "photo": "https://www.wwu.edu/sites/default/files/styles/large/public/2022-01/VC.jpg.webp?itok=RdD0YWGS",
        "photoAlt": "Students gathered in front of the Viking Commons, a two story brick building with angled roofs.",
        "accessibility": [
                "Accessible restrooms on the main level near the entrance",
                "Accessible parking to the north (Lot 6V)"
        ],
        "genderNeutral": null,
        "note": null,
        "source": "Western Washington University"
    },
    "VU": {
        "url": "https://www.wwu.edu/building/vu",
        "photo": "https://www.wwu.edu/sites/default/files/styles/large/public/2022-01/Viking%20Union.jpg.webp?itok=1LszskYj",
        "photoAlt": "Viking Union, a brick and glass building on a hillside with a large banner reading \"Make Waves\" running down the side.",
        "accessibility": [
                "Automatic doors at High St. and the VU Plaza on the 6th floor, and on the 1st floor at the Garden St. entrance",
                "Accessible restrooms on floors 3, 4, 5 and 6",
                "Accessible parking on the north side of the building (Lot 6V)"
        ],
        "genderNeutral": "VU 351, 353, 714, 715, 716, 717",
        "note": null,
        "source": "Western Washington University"
    },
    "WL": {
        "url": "https://www.wwu.edu/building/wl",
        "photo": "https://www.wwu.edu/sites/default/files/styles/large/public/2022-01/Wilson%20spring.jpg.webp?itok=pzJPd75e",
        "photoAlt": "Wilson Library, a brick building with a terra cotta roof and arched windows",
        "accessibility": [
                "Accessible entrances via the Haggard Hall sky bridge, or at the southeast corner",
                "Accessible restrooms on the first floor (or in Haggard Hall)",
                "Wheelchair access via the Haggard Hall library entrances, then across the sky bridge",
                "The southwest elevator (near the Media/Circulation desk) serves floors 2-6",
                "The east and west elevators serve floors 1-5"
        ],
        "genderNeutral": "WL 165A (within DAC); 182 (open all hours); 668 & 669 (Mon-Fri 8 am-4 pm)",
        "note": null,
        "source": "Western Washington University"
    }
};

// "Miller Hall (MH)" -> "MH". Uses the LAST bracketed code, so names that contain other
// brackets, like "Birnam Wood (Buildings 1-7) (BW)", still work.
function wwuBuildingCode(name) {
    const match = String(name || "").match(/\(([A-Z]{2,3})\)\s*$/);
    return match ? match[1] : null;
}

function wwuGetBuildingInfo(name) {
    const code = wwuBuildingCode(name);
    return (code && Object.prototype.hasOwnProperty.call(WWU_BUILDING_INFO, code)) ? WWU_BUILDING_INFO[code] : null;
}

// True only when WWU's page actually lists accessibility details for the building
// (a few have a page but nothing listed, and those shouldn't get the "documented" badge)
function wwuBuildingHasDetails(name) {
    const info = wwuGetBuildingInfo(name);
    return !!(info && info.accessibility && info.accessibility.length > 0);
}

function wwuInfoEscape(value) {
    if (value === null || value === undefined) return "";
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Builds the inside of a building popup: photo, name, WWU's accessibility lines, and a link
// to the official page. Returns "" for a building we have no WWU page for, so the caller can
// fall back to whatever it showed before. Pass { compact: true } for the smaller report-form popup.
function wwuBuildBuildingInfoHtml(name, options) {
    const info = wwuGetBuildingInfo(name);
    if (!info) return "";

    const compact = !!(options && options.compact);
    const photoHeight = compact ? 110 : 140;
    const detailsMaxHeight = compact ? 130 : 180;

    // The picture sits in a wrapper that hides itself if the image fails to load, so a broken
    // or blocked photo never leaves an empty box or a "broken image" icon in the popup
    const photoHtml = info.photo
        ? `<div style="margin: 0 0 8px 0;">
               <img src="${wwuInfoEscape(info.photo)}" alt="${wwuInfoEscape(info.photoAlt)}"
                    loading="lazy" decoding="async" referrerpolicy="no-referrer"
                    onerror="this.parentNode.style.display='none'"
                    style="display: block; width: 100%; height: ${photoHeight}px; object-fit: cover; border-radius: 6px; background: #e2e8f0;">
           </div>`
        : "";

    const lines = (info.accessibility || []);
    const detailsHtml = lines.length > 0
        ? `<div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; color: #475569; margin: 8px 0 4px 0;">Accessibility (per WWU)</div>
           <div role="region" aria-label="Accessibility details" tabindex="0" style="max-height: ${detailsMaxHeight}px; overflow-y: auto;">
               <ul style="margin: 0; padding-left: 16px; font-size: 12px; color: #334155; line-height: 1.45;">
                   ${lines.map(line => `<li style="margin-bottom: 3px;">${wwuInfoEscape(line)}</li>`).join("")}
               </ul>
           </div>`
        : `<p style="font-size: 12px; color: #64748b; margin: 8px 0 0 0;">${wwuInfoEscape(info.note || "WWU's page for this building doesn't list accessibility details.")}</p>`;

    const genderNeutralHtml = info.genderNeutral
        ? `<p style="font-size: 12px; color: #334155; margin: 8px 0 0 0;"><strong>Gender-neutral restrooms:</strong> ${wwuInfoEscape(info.genderNeutral)}</p>`
        : "";

    // The note is shown separately only when there ARE accessibility lines (otherwise it is
    // already the message above)
    const noteHtml = (lines.length > 0 && info.note)
        ? `<p style="font-size: 11px; color: #64748b; font-style: italic; margin: 6px 0 0 0;">${wwuInfoEscape(info.note)}</p>`
        : "";

    const safeUrl = /^https:\/\//.test(info.url || "") ? info.url : "";
    const linkHtml = safeUrl
        ? `<p style="font-size: 12px; margin: 8px 0 0 0;"><a href="${wwuInfoEscape(safeUrl)}" target="_blank" rel="noopener noreferrer" style="color: #003F87; font-weight: 600;">Full details on WWU's site &#8599;</a></p>`
        : "";

    return `${photoHtml}
        <h4 style="margin: 0; font-size: 14px; color: #0f172a;">${wwuInfoEscape(name)}</h4>
        ${detailsHtml}
        ${genderNeutralHtml}
        ${noteHtml}
        ${linkHtml}
        <p style="font-size: 10px; color: #94a3b8; margin: 6px 0 0 0;">Source: ${wwuInfoEscape(info.source)}, checked ${wwuInfoEscape(WWU_BUILDING_INFO_CHECKED)}</p>`;
}
