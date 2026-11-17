// Studio branding, layouts, finishes and indicative pricing.
export const CONFIG = {
  brandName: "Your Studio",
  senderName: "Team Your Studio",
  contactPhone: "+91 00000 00000",
  contactEmail: "hello@yourstudio.in",
  botName: "Pip",
  showPriceOnOptions: true,
  // true = lighter background for slow kiosk PCs (no blur behind the glass panes)
  lowPowerBackground: false,
  layouts: {
    "2bhk": { image: "/demo/living-room.jpg", name: "2 BHK Apartment", area: "about 1,100 sq ft", base: 650000,  factor: 1.0 },
    "3bhk": { image: "/demo/dining-room.jpg", name: "3 BHK Apartment", area: "about 1,550 sq ft", base: 900000,  factor: 1.35 },
    "4bhk": { image: "/demo/apartment-exterior.jpg", name: "4 BHK Villa",     area: "about 2,800 sq ft", base: 1650000, factor: 2.1 }
  },
  // "add" is the extra cost for a 2 BHK; it is multiplied by the layout's factor.
  questions: [
    { id: "kitchen", label: "Kitchen", title: "Which kitchen finish do you like?", sub: "Shutters and visible surfaces of the modular kitchen.",
      options: [
        { label: "Laminate", desc: "Hard-wearing, matte or textured, widest colour range.", add: 0,      sw: "linear-gradient(135deg,#d8c3a5,#b89b74)" },
        { label: "Acrylic",  desc: "High-gloss, mirror-like shutters that wipe clean.",      add: 120000, sw: "linear-gradient(135deg,#ffffff,#d9e4f5)" },
        { label: "PU lacquer", desc: "Seamless painted look in any shade.",                  add: 160000, sw: "linear-gradient(135deg,#7b8a7a,#4f5d50)" },
        { label: "Stainless steel", desc: "Hygienic, moisture-proof, lasts decades.",        add: 220000, sw: "linear-gradient(135deg,#eef0f3,#9aa1ab)" }
      ]},
    { id: "wardrobe", label: "Wardrobes", title: "What kind of wardrobes?", sub: "Applied to every bedroom in the layout.",
      options: [
        { label: "Hinged, laminate", desc: "Classic swing doors, full access to the inside.", add: 0,      sw: "linear-gradient(135deg,#e8dccb,#c9b28f)" },
        { label: "Sliding, laminate", desc: "Saves space in tighter bedrooms.",              add: 60000,  sw: "linear-gradient(135deg,#d6d0c7,#a99f91)" },
        { label: "Acrylic shutters", desc: "Glossy finish that brightens the room.",          add: 90000,  sw: "linear-gradient(135deg,#fdf6f0,#e7d6c8)" },
        { label: "Glass profile", desc: "Aluminium frame with tinted glass and lighting.",   add: 140000, sw: "linear-gradient(135deg,#5b6470,#2e343c)" }
      ]},
    { id: "ceiling", label: "False ceiling", title: "How much false ceiling?", sub: "Gypsum ceiling with lighting design.",
      options: [
        { label: "Keep it minimal", desc: "Painted ceiling with surface lights.",            add: 0,      sw: "linear-gradient(135deg,#ffffff,#eef0f4)" },
        { label: "Living and dining only", desc: "Cove lighting in the main spaces.",          add: 70000,  sw: "linear-gradient(135deg,#fff7e0,#f3dfae)" },
        { label: "Whole home", desc: "Every room, with profile and cove lighting.",           add: 150000, sw: "linear-gradient(135deg,#fff1cc,#e8c56a)" }
      ]},
    { id: "flooring", label: "Flooring", title: "Flooring for living and dining?", sub: "Bedrooms keep the builder's flooring unless you change it later.",
      options: [
        { label: "Keep builder flooring", desc: "No change.",                                 add: 0,      sw: "linear-gradient(135deg,#e9e6e1,#cfcac2)" },
        { label: "Large vitrified tiles", desc: "Fewer joints, cleaner look.",               add: 90000,  sw: "linear-gradient(135deg,#f2efe9,#d8d2c8)" },
        { label: "Engineered wood", desc: "Warm and quiet underfoot.",                        add: 180000, sw: "linear-gradient(135deg,#c79a6b,#8a5a35)" },
        { label: "Italian marble", desc: "Polished natural stone.",                           add: 320000, sw: "linear-gradient(135deg,#ffffff,#d7d3cf)" }
      ]},
    { id: "smart", label: "Lighting and automation", title: "Any smart-home features?", sub: "Controls for lights, curtains and scenes.",
      options: [
        { label: "Standard switches", desc: "Modular switches throughout.",                   add: 0,      sw: "linear-gradient(135deg,#ffffff,#e6e7eb)" },
        { label: "Smart lighting", desc: "App and voice control for lights.",                add: 45000,  sw: "linear-gradient(135deg,#d5ecff,#8cc6ff)" },
        { label: "Full automation", desc: "Lights, curtains, AC and scenes from one panel.",  add: 150000, sw: "linear-gradient(135deg,#d9d2ff,#8e7bff)" }
      ]}
  ],
  tips: [
    "Tap a folder on the left to start.",
    "Pinch with two fingers to zoom the board.",
    "Pinch on a photo to make it bigger.",
    "Flick a photo and watch it glide.",
    "Double-tap anything to zoom to it.",
    "Open Floor plans for a quick estimate."
  ]
};
