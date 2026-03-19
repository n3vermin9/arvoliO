// storage.js - LocalStorage initialization with default user data

const defaultData = {
  auth: '',
  users: [
    {
      id: "user_001",
      tag: "alexj",
      name: "Alex Johnson",
      gender: "male",
      age: 28,
      city: "New York",
      preferredGender: "female",
      socials: {
        instagram: "alex_j",
        telegram: "alexj_telegram",
        snapchat: "alex_j_snap",
      },
      pfp: "https://randomuser.me/api/portraits/men/1.jpg",
      requests: [
        {
          id: "req_001",
          fromUserId: "user_003",
          status: "pending",
          timestamp: "2024-01-15T10:30:00Z",
        },
      ],
      matches: [
        {
          id: "match_001",
          userId: "user_002",
          matchedAt: "2024-01-10T15:20:00Z",
          lastMessage: "Hey, how's it going?",
        },
      ],
    },
    {
      id: "user_002",
      tag: "samanthal",
      name: "Samantha Lee",
      gender: "female",
      age: 26,
      city: "Los Angeles",
      preferredGender: "male",
      socials: {
        instagram: "sam_lee",
        telegram: "samlee_tg",
        snapchat: "sam_lee_snap",
      },
      pfp: "https://randomuser.me/api/portraits/women/2.jpg",
      requests: [],
      matches: [
        {
          id: "match_001",
          userId: "user_001",
          matchedAt: "2024-01-10T15:20:00Z",
          lastMessage: "Hey, how's it going?",
        },
      ],
    },
    {
      id: "user_003",
      tag: "mikec",
      name: "Mike Chen",
      gender: "male",
      age: 30,
      city: "Chicago",
      preferredGender: "female",
      socials: {
        instagram: "mike_chen",
        telegram: "mikechen_tg",
        snapchat: "mike_c_snap",
      },
      pfp: "https://randomuser.me/api/portraits/men/3.jpg",
      requests: [],
      matches: [],
    },
    {
      id: "user_004",
      tag: "emilyr",
      name: "Emily Rodriguez",
      gender: "female",
      age: 27,
      city: "Miami",
      preferredGender: "male",
      socials: {
        instagram: "emily_r",
        telegram: "emilyrod_tg",
        snapchat: "emily_r_snap",
      },
      pfp: "https://randomuser.me/api/portraits/women/4.jpg",
      requests: [],
      matches: [],
    },
    {
      id: "user_005",
      tag: "davidk",
      name: "David Kim",
      gender: "male",
      age: 29,
      city: "Seattle",
      preferredGender: "female",
      socials: {
        instagram: "david_kim",
        telegram: "davidkim_tg",
        snapchat: "david_k_snap",
      },
      pfp: "https://randomuser.me/api/portraits/men/5.jpg",
      requests: [],
      matches: [],
    },
  ],

  // Current user session (matches the green 'user' in your diagram)
  currentUser: {
    id: "user_001",
    tag: "alexj",
    isAuthenticated: true,
    lastLogin: new Date().toISOString(),
  },

  // App metadata
  metadata: {
    version: "1.0.0",
    lastUpdated: new Date().toISOString(),
    totalUsers: 5,
  },
};

// Function to initialize localStorage with default data
export const initializeStorage = () => {
  if (!localStorage.getItem("appData")) {
    localStorage.setItem("appData", JSON.stringify(defaultData));
    console.log("LocalStorage initialized with default data");
  } else {
    console.log("LocalStorage already contains data");
  }
};

// Function to get all data
export const getAllData = () => {
  const data = localStorage.getItem("appData");
  return data ? JSON.parse(data) : null;
};

// Function to get current user data
export const getCurrentUser = () => {
  const data = getAllData();
  if (data && data.currentUser) {
    const userId = data.currentUser.id;
    return data.users.find((user) => user.id === userId) || null;
  }
  return null;
};

// Function to get all users
export const getAllUsers = () => {
  const data = getAllData();
  return data ? data.users : [];
};

// Function to get user by ID
export const getUserById = (userId) => {
  const data = getAllData();
  return data ? data.users.find((user) => user.id === userId) : null;
};

// Function to get user by tag
export const getUserByTag = (tag) => {
  const data = getAllData();
  return data ? data.users.find((user) => user.tag === tag) : null;
};

// Function to get matches for current user with full user details
export const getCurrentUserMatches = () => {
  const currentUser = getCurrentUser();
  if (!currentUser) return [];

  const data = getAllData();
  const matches = currentUser.matches.map((match) => {
    const matchedUser = data.users.find((user) => user.id === match.userId);
    return {
      ...match,
      matchedUser: matchedUser
        ? {
            id: matchedUser.id,
            tag: matchedUser.tag,
            name: matchedUser.name,
            pfp: matchedUser.pfp,
            age: matchedUser.age,
            city: matchedUser.city,
          }
        : null,
    };
  });

  return matches;
};

// Function to get requests for current user with full user details
export const getCurrentUserRequests = () => {
  const currentUser = getCurrentUser();
  if (!currentUser) return [];

  const data = getAllData();
  const requests = currentUser.requests.map((request) => {
    const requestingUser = data.users.find(
      (user) => user.id === request.fromUserId,
    );
    return {
      ...request,
      fromUser: requestingUser
        ? {
            id: requestingUser.id,
            tag: requestingUser.tag,
            name: requestingUser.name,
            pfp: requestingUser.pfp,
            age: requestingUser.age,
            city: requestingUser.city,
          }
        : null,
    };
  });

  return requests;
};

// Function to update user data
export const updateUser = (userId, updatedData) => {
  const data = getAllData();
  if (!data) return false;

  const userIndex = data.users.findIndex((user) => user.id === userId);
  if (userIndex === -1) return false;

  data.users[userIndex] = { ...data.users[userIndex], ...updatedData };

  // If updating current user, also update the currentUser session
  if (data.currentUser && data.currentUser.id === userId) {
    data.currentUser = {
      ...data.currentUser,
      ...(updatedData.tag && { tag: updatedData.tag }),
    };
  }

  data.metadata.lastUpdated = new Date().toISOString();
  localStorage.setItem("appData", JSON.stringify(data));
  return true;
};

// Function to add a new user
export const addUser = (newUser) => {
  const data = getAllData();
  if (!data) return false;

  // Generate a new ID
  const newId = `user_${String(data.users.length + 1).padStart(3, "0")}`;

  // Use tag as provided (no @ symbol validation)
  const user = {
    id: newId,
    tag: newUser.tag || `${newUser.name.toLowerCase().replace(/\s+/g, "")}`,
    name: newUser.name,
    gender: newUser.gender,
    age: newUser.age,
    city: newUser.city,
    preferredGender: newUser.preferredGender,
    socials: {
      instagram: newUser.socials?.instagram || "",
      telegram: newUser.socials?.telegram || "",
      snapchat: newUser.socials?.snapchat || "",
    },
    pfp: newUser.pfp || "https://randomuser.me/api/portraits/lego/1.jpg",
    requests: [],
    matches: [],
  };

  data.users.push(user);
  data.metadata.totalUsers = data.users.length;
  data.metadata.lastUpdated = new Date().toISOString();

  localStorage.setItem("appData", JSON.stringify(data));
  return user.id;
};

// Function to send a friend request
export const sendRequest = (fromUserId, toUserId) => {
  const data = getAllData();
  if (!data) return false;

  const toUser = data.users.find((u) => u.id === toUserId);
  const fromUser = data.users.find((u) => u.id === fromUserId);

  if (!toUser || !fromUser) return false;

  // Check if request already exists
  const existingRequest = toUser.requests.find(
    (r) => r.fromUserId === fromUserId,
  );
  if (existingRequest) return false;

  const newRequest = {
    id: `req_${String(Date.now())}`,
    fromUserId: fromUserId,
    status: "pending",
    timestamp: new Date().toISOString(),
  };

  toUser.requests.push(newRequest);

  data.metadata.lastUpdated = new Date().toISOString();
  localStorage.setItem("appData", JSON.stringify(data));
  return true;
};

// Function to accept a friend request
export const acceptRequest = (userId, requestId) => {
  const data = getAllData();
  if (!data) return false;

  const user = data.users.find((u) => u.id === userId);
  if (!user) return false;

  const requestIndex = user.requests.findIndex((r) => r.id === requestId);
  if (requestIndex === -1) return false;

  const request = user.requests[requestIndex];
  const fromUser = data.users.find((u) => u.id === request.fromUserId);

  if (!fromUser) return false;

  // Create match for both users
  const matchId = `match_${String(Date.now())}`;
  const matchTime = new Date().toISOString();

  const matchForUser = {
    id: matchId,
    userId: fromUser.id,
    matchedAt: matchTime,
    lastMessage: "",
  };

  const matchForFromUser = {
    id: matchId,
    userId: user.id,
    matchedAt: matchTime,
    lastMessage: "",
  };

  user.matches.push(matchForUser);
  fromUser.matches.push(matchForFromUser);

  // Remove the request
  user.requests.splice(requestIndex, 1);

  data.metadata.lastUpdated = new Date().toISOString();
  localStorage.setItem("appData", JSON.stringify(data));
  return true;
};

// Function to reject/decline a friend request
export const rejectRequest = (userId, requestId) => {
  const data = getAllData();
  if (!data) return false;

  const user = data.users.find((u) => u.id === userId);
  if (!user) return false;

  const requestIndex = user.requests.findIndex((r) => r.id === requestId);
  if (requestIndex === -1) return false;

  // Remove the request
  user.requests.splice(requestIndex, 1);

  data.metadata.lastUpdated = new Date().toISOString();
  localStorage.setItem("appData", JSON.stringify(data));
  return true;
};

// Function to clear all data (for testing)
export const clearAllData = () => {
  localStorage.removeItem("appData");
  console.log("LocalStorage cleared");
};

// Function to reset to default data
export const resetToDefault = () => {
  clearAllData();
  initializeStorage();
};

// Export the default data structure for reference
export { defaultData };

// Auto-initialize when this module loads
initializeStorage();
