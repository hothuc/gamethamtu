const locations = [
  ["Living Room", "Bedroom", "Storeroom", "Bathroom", "Kitchen", "Balcony"],
  ["Vacation Home", "Park", "Supermarket", "School", "Woods", "Bank"],
  ["Pub", "Bookstore", "Restaurant", "Hotel", "Hospital", "Building Site"],
  ["Playground", "Classroom", "Dormitory", "Cafeteria", "Elevator", "Toilet"]
];

const causeOfDeathTile = [
  "Suffocation", "Severe Injury", "Loss of Blood",
  "Illness/ Disease", "Poisoning", "Accident"
];

const eventTiles = [
  ["Brown", "Motive of Crime", "Hatred", "Power", "Money", "Love", "Jealousy", "Justice"],
  ["Brown", "Weather", "Sunny", "Stormy", "Dry", "Humid", "Cold", "Hot"],
  ["Brown", "Hint on Corpse", "Head", "Chest", "Hand", "Leg", "Partial", "All-over"],
  ["Brown", "General Impression", "Common", "Creative", "Fishy", "Cruel", "Horrible", "Suspenseful"],
  ["Brown", "Corpse Condition", "Still Warm", "Stiff", "Decayed", "Incomplete", "Intact", "Twisted"],
  ["Brown", "Victim's Identity", "Child", "Young Adult", "Middle-Aged", "Senior", "Male", "Female"],
  ["Brown", "Murderer's Personality", "Arrogant", "Despicable", "Furious", "Greedy", "Forceful", "Perverted"],
  ["Brown", "State of The Scene", "Bits and Pieces", "Ashes", "Water Stain", "Cracked", "Disorderly", "Tidy"],
  ["Brown", "Victim's Build", "Large", "Thin", "Tall", "Short", "Disfigured", "Fit"],
  ["Brown", "Victim's Clothes", "Neat", "Untidy", "Elegant", "Shabby", "Bizarre", "Naked"],
  ["Brown", "Evidence Left Behind", "Natural", "Artistic", "Written", "Synthetic", "Personal", "Unrelated"],
  ["Brown", "Victim's Expression", "Peaceful", "Struggling", "Frightened", "In Pain", "Blank", "Angry"],
  ["Brown", "Time of Death", "Dawn", "Morning", "Noon", "Afternoon", "Evening", "Midnight"],
  ["Brown", "Duration of Crime", "Instanteous", "Brief", "Gradual", "Prolonged", "Few Days", "Unclear"],
  ["Brown", "Trace at the Scene", "Fingerprint", "Footprint", "Bruise", "Blood Stain", "Body Fluid", "Scar"],
  ["Brown", "Noticed by Bystander", "Sudden sound", "Prolonged sound", "Smell", "Visual", "Action", "Nothing"],
  ["Brown", "Social Relationship", "Relatives", "Friends", "Colleagues", "Employer/ Employee", "Lovers", "Strangers"],
  ["Brown", "Victim's Occupation", "Boss", "Professional", "Worker", "Student", "Unemployed", "Retired"],
  ["Brown", "In Progress", "Entertainment", "Relaxation", "Assembly", "Trading", "Visit", "Dining"],
  ["Brown", "Sudden Incident", "Power Failure", "Fire", "Conflict", "Loss of Valuables", "Scream", "Nothing"],
  ["Brown", "Day of Crime", "Weekday", "Weekend", "Spring", "Summer", "Autumn", "Winter"],
  ["Special", "Countdown", "The Forensic Scientist draws 2 scene tiles and substitutes them..."],
  ["Special", "Erroneous Information", "The Forensic Scientist chooses 1 scene tile and changes it..."],
  ["Special", "A Good Twist", "Previous winner gets a bonus guess..."],
  ["Special", "A Useful Clue", "Forensic draws 5 new scene tiles..."],
  ["Special", "Ruled Out Evidence", "Each player flips one of their own clue cards..."],
  ["Special", "Secret Testimony", "Witness points at a tile to eliminate..."]
];

if (typeof module !== 'undefined') {
  module.exports = { locations, causeOfDeathTile, eventTiles };
}
