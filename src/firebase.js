import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  arrayUnion,
  arrayRemove,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export const getUserData = async (userId) => {
  const userDoc = await getDoc(doc(db, "users", userId));
  return userDoc.exists() ? userDoc.data() : null;
};

export const getNextProfile = async (currentUserId) => {
  const currentUserDoc = await getDoc(doc(db, "users", currentUserId));

  if (!currentUserDoc.exists()) return null;

  const currentUser = currentUserDoc.data();
  const swipedIds = currentUser.swipes || [];
  const dislikedIds = currentUser.dislikes || [];
  const interestedIn = currentUser.interestedIn || "both";

  const usersRef = collection(db, "users");
  const querySnapshot = await getDocs(usersRef);

  const usersWhoLikedMe = [];
  querySnapshot.forEach((document) => {
    const userData = document.data();
    if (
      userData.likesWithMessages &&
      userData.likesWithMessages.some((like) => like.userId === currentUserId)
    ) {
      usersWhoLikedMe.push(document.id);
    }
  });

  const eligibleUsers = [];
  querySnapshot.forEach((document) => {
    const userData = document.data();
    if (
      document.id !== currentUserId &&
      !swipedIds.includes(document.id) &&
      !dislikedIds.includes(document.id) &&
      !usersWhoLikedMe.includes(document.id) &&
      userData.hasProfile === true
    ) {
      const ageDiff = Math.abs(userData.age - currentUser.age);
      if (ageDiff <= 5) {
        if (interestedIn === "both") {
          eligibleUsers.push({ id: document.id, ...userData });
        } else if (interestedIn === userData.gender) {
          eligibleUsers.push({ id: document.id, ...userData });
        }
      }
    }
  });

  return eligibleUsers.length > 0 ? eligibleUsers[0] : null;
};

export const createSwipe = async (swiperId, swipedId, direction) => {
  const swiperRef = doc(db, "users", swiperId);
  const swipedUserRef = doc(db, "users", swipedId);

  if (direction === "pass") {
    await updateDoc(swiperRef, {
      dislikes: arrayUnion(swipedId),
    });
    return { matched: false };
  }

  await updateDoc(swiperRef, {
    swipes: arrayUnion(swipedId),
  });

  const currentUserDoc = await getDoc(swiperRef);
  const currentUser = currentUserDoc.data();
  const swipedUserDoc = await getDoc(swipedUserRef);
  const swipedUser = swipedUserDoc.data();

  if (direction === "like") {
    const existingLike = swipedUser.likesWithMessages?.some(
      (like) => like.userId === swiperId,
    );

    if (!existingLike) {
      await updateDoc(swipedUserRef, {
        likesWithMessages: arrayUnion({
          userId: swiperId,
          name: currentUser.name,
          age: currentUser.age,
          photos: currentUser.photos || [],
          message: null,
          timestamp: new Date().toISOString(),
        }),
      });
    }

    if (
      swipedUser &&
      swipedUser.swipes &&
      swipedUser.swipes.includes(swiperId)
    ) {
      const matchId = `${swiperId}_${swipedId}`;
      const timestamp = new Date().toISOString();

      const matchData = {
        id: matchId,
        userId: swipedId,
        name: swipedUser.name,
        age: swipedUser.age,
        photos: swipedUser.photos || [],
        timestamp: timestamp,
        lastMessage: "",
        lastMessageTime: null,
        unreadCount: 0,
      };

      await updateDoc(swiperRef, {
        matches: arrayUnion(matchData),
      });

      await updateDoc(swipedUserRef, {
        matches: arrayUnion({
          id: matchId,
          userId: swiperId,
          name: currentUser.name,
          age: currentUser.age,
          photos: currentUser.photos || [],
          timestamp: timestamp,
          lastMessage: "",
          lastMessageTime: null,
          unreadCount: 0,
        }),
      });

      const chatRef = doc(db, "chats", matchId);
      const chatDoc = await getDoc(chatRef);
      if (!chatDoc.exists()) {
        await setDoc(chatRef, {
          user1: swiperId,
          user2: swipedId,
          createdAt: timestamp,
          lastMessage: "",
          lastMessageTime: null,
          hasMessages: false,
        });
      }

      await updateDoc(swipedUserRef, {
        likesWithMessages: arrayRemove({
          userId: swiperId,
          name: currentUser.name,
          age: currentUser.age,
          photos: currentUser.photos || [],
          message: null,
          timestamp: new Date().toISOString(),
        }),
      });

      return { matched: true, matchId };
    }
  }

  return { matched: false };
};

export const sendMessageWithLike = async (swiperId, swipedId, message) => {
  const swiperRef = doc(db, "users", swiperId);
  const swipedUserRef = doc(db, "users", swipedId);

  await updateDoc(swiperRef, {
    swipes: arrayUnion(swipedId),
  });

  const currentUserDoc = await getDoc(swiperRef);
  const currentUser = currentUserDoc.data();
  const swipedUserDoc = await getDoc(swipedUserRef);
  const swipedUser = swipedUserDoc.data();

  const existingLike = swipedUser.likesWithMessages?.some(
    (like) => like.userId === swiperId,
  );

  if (!existingLike) {
    await updateDoc(swipedUserRef, {
      likesWithMessages: arrayUnion({
        userId: swiperId,
        name: currentUser.name,
        age: currentUser.age,
        photos: currentUser.photos || [],
        message: message,
        timestamp: new Date().toISOString(),
      }),
    });
  }

  if (swipedUser && swipedUser.swipes && swipedUser.swipes.includes(swiperId)) {
    const matchId = `${swiperId}_${swipedId}`;
    const timestamp = new Date().toISOString();

    const matchData = {
      id: matchId,
      userId: swipedId,
      name: swipedUser.name,
      age: swipedUser.age,
      photos: swipedUser.photos || [],
      timestamp: timestamp,
      lastMessage: "",
      lastMessageTime: null,
      unreadCount: 0,
    };

    await updateDoc(swiperRef, {
      matches: arrayUnion(matchData),
    });

    await updateDoc(swipedUserRef, {
      matches: arrayUnion({
        id: matchId,
        userId: swiperId,
        name: currentUser.name,
        age: currentUser.age,
        photos: currentUser.photos || [],
        timestamp: timestamp,
        lastMessage: "",
        lastMessageTime: null,
        unreadCount: 0,
      }),
    });

    const chatRef = doc(db, "chats", matchId);
    await setDoc(chatRef, {
      user1: swiperId,
      user2: swipedId,
      createdAt: timestamp,
      lastMessage: message,
      lastMessageTime: serverTimestamp(),
      hasMessages: true,
    });

    await updateDoc(swipedUserRef, {
      likesWithMessages: arrayRemove({
        userId: swiperId,
        name: currentUser.name,
        age: currentUser.age,
        photos: currentUser.photos || [],
        message: message,
        timestamp: new Date().toISOString(),
      }),
    });

    return { matched: true, matchId };
  }

  return { matched: false, likeSent: true };
};

export const sendMessage = async (matchId, senderId, message) => {
  const messagesRef = collection(db, "chats", matchId, "messages");
  const messageData = {
    senderId: senderId,
    message: message,
    timestamp: serverTimestamp(),
    read: false,
  };

  const docRef = await addDoc(messagesRef, messageData);

  await updateDoc(doc(db, "chats", matchId), {
    lastMessage: message,
    lastMessageTime: serverTimestamp(),
    lastSenderId: senderId,
    hasMessages: true,
  });

  const otherUserId = matchId.split("_").find((id) => id !== senderId);
  const otherUserRef = doc(db, "users", otherUserId);
  const otherUserDoc = await getDoc(otherUserRef);

  if (otherUserDoc.exists()) {
    const otherUserData = otherUserDoc.data();
    const updatedMatches = otherUserData.matches.map((m) => {
      if (m.id === matchId) {
        return { ...m, unreadCount: (m.unreadCount || 0) + 1 };
      }
      return m;
    });
    await updateDoc(otherUserRef, { matches: updatedMatches });
  }

  return docRef.id;
};

export const markMessagesAsRead = async (matchId, userId) => {
  const messagesRef = collection(db, "chats", matchId, "messages");
  const q = query(messagesRef, orderBy("timestamp", "asc"));
  const snapshot = await getDocs(q);

  const batch = [];
  snapshot.forEach((document) => {
    const data = document.data();
    if (data.senderId !== userId && !data.read) {
      batch.push(
        updateDoc(doc(db, "chats", matchId, "messages", document.id), {
          read: true,
        }),
      );
    }
  });

  await Promise.all(batch);

  const userRef = doc(db, "users", userId);
  const userDoc = await getDoc(userRef);
  if (userDoc.exists()) {
    const userData = userDoc.data();
    const updatedMatches = userData.matches.map((m) => {
      if (m.id === matchId) {
        return { ...m, unreadCount: 0 };
      }
      return m;
    });
    await updateDoc(userRef, { matches: updatedMatches });
  }
};

export const listenToMessages = (matchId, callback) => {
  const messagesRef = collection(db, "chats", matchId, "messages");
  const q = query(messagesRef, orderBy("timestamp", "asc"));

  return onSnapshot(q, (snapshot) => {
    const messages = [];
    snapshot.forEach((document) => {
      messages.push({
        id: document.id,
        ...document.data(),
      });
    });
    callback(messages);
  });
};

export const listenToMatches = (userId, callback) => {
  const userRef = doc(db, "users", userId);
  return onSnapshot(userRef, async (document) => {
    if (document.exists()) {
      const userData = document.data();
      const matches = userData.matches || [];

      const validMatches = [];
      for (const match of matches) {
        const otherUserDoc = await getDoc(doc(db, "users", match.userId));
        if (otherUserDoc.exists()) {
          const otherUser = otherUserDoc.data();
          if (otherUser.hasProfile !== false) {
            const otherUserMatches = otherUser.matches || [];
            const isMutual = otherUserMatches.some((m) => m.userId === userId);

            if (isMutual) {
              const chatDoc = await getDoc(doc(db, "chats", match.id));
              if (chatDoc.exists()) {
                const chatData = chatDoc.data();
                validMatches.push({
                  ...match,
                  lastMessage: chatData.lastMessage || "",
                  lastMessageTime: chatData.lastMessageTime,
                  unreadCount: match.unreadCount || 0,
                });
              } else {
                validMatches.push(match);
              }
            }
          }
        }
      }

      validMatches.sort((a, b) => {
        if (!a.lastMessageTime) return 1;
        if (!b.lastMessageTime) return -1;
        const aTime = a.lastMessageTime?.toDate
          ? a.lastMessageTime.toDate()
          : new Date(a.lastMessageTime);
        const bTime = b.lastMessageTime?.toDate
          ? b.lastMessageTime.toDate()
          : new Date(b.lastMessageTime);
        return bTime - aTime;
      });

      callback(validMatches);
    }
  });
};

export const listenToChatUpdates = (matchId, callback) => {
  const chatRef = doc(db, "chats", matchId);
  return onSnapshot(chatRef, (document) => {
    if (document.exists()) {
      const chatData = document.data();
      callback({
        lastMessage: chatData.lastMessage || "",
        lastMessageTime: chatData.lastMessageTime,
      });
    }
  });
};

export const listenToNewLikes = (userId, callback) => {
  const userRef = doc(db, "users", userId);
  
  return onSnapshot(userRef, (document) => {
    if (document.exists()) {
      const userData = document.data();
      const likesWithMessages = userData.likesWithMessages || [];
      callback(likesWithMessages);
    }
  });
};

export const respondToLike = async (userId, likedUserId, accept) => {
  if (accept) {
    await createSwipe(userId, likedUserId, "like");
  }

  const userRef = doc(db, "users", userId);
  const userDoc = await getDoc(userRef);
  const userData = userDoc.data();

  const updatedLikes = (userData.likesWithMessages || []).filter(
    (like) => like.userId !== likedUserId,
  );
  await updateDoc(userRef, { likesWithMessages: updatedLikes });

  const likedUserRef = doc(db, "users", likedUserId);
  const likedUserDoc = await getDoc(likedUserRef);
  const likedUserData = likedUserDoc.data();

  const updatedSentLikes = (likedUserData.likesWithMessages || []).filter(
    (like) => like.userId !== userId,
  );
  await updateDoc(likedUserRef, { likesWithMessages: updatedSentLikes });
};

export const listenToUnreadCounts = (userId, callback) => {
  const userRef = doc(db, "users", userId);

  return onSnapshot(userRef, async (document) => {
    if (document.exists()) {
      const userData = document.data();
      const matches = userData.matches || [];

      let unreadChats = 0;
      for (const match of matches) {
        if (match.unreadCount > 0) {
          unreadChats += match.unreadCount;
        }
      }

      const usersRef = collection(db, "users");
      const querySnapshot = await getDocs(usersRef);
      let unreadLikes = 0;
      querySnapshot.forEach((doc) => {
        const user = doc.data();
        if (
          user.likesWithMessages &&
          user.likesWithMessages.some((like) => like.userId === userId)
        ) {
          unreadLikes++;
        }
      });

      callback(unreadChats, unreadLikes);
    }
  });
};

export const removeMatch = async (matchId, userId, otherUserId) => {
  const userRef = doc(db, "users", userId);
  const otherUserRef = doc(db, "users", otherUserId);

  const userDoc = await getDoc(userRef);
  const otherUserDoc = await getDoc(otherUserRef);

  if (userDoc.exists()) {
    const userData = userDoc.data();
    const updatedMatches = userData.matches.filter((m) => m.id !== matchId);
    await updateDoc(userRef, { matches: updatedMatches });
  }

  if (otherUserDoc.exists()) {
    const otherUserData = otherUserDoc.data();
    const updatedOtherMatches = otherUserData.matches.filter(
      (m) => m.id !== matchId,
    );
    await updateDoc(otherUserRef, { matches: updatedOtherMatches });
  }

  const chatRef = doc(db, "chats", matchId);
  const chatDoc = await getDoc(chatRef);

  if (chatDoc.exists()) {
    const chatData = chatDoc.data();
    if (!chatData.hasMessages) {
      await deleteDoc(chatRef);
    }
  }

  return true;
};

export const blockUser = async (userId, otherUserId, matchId) => {
  const userRef = doc(db, "users", userId);
  const otherUserRef = doc(db, "users", otherUserId);

  const userDoc = await getDoc(userRef);
  const otherUserDoc = await getDoc(otherUserRef);

  const userData = userDoc.data();
  const otherUserData = otherUserDoc.data();

  const match = userData.matches?.find((m) => m.id === matchId);

  if (match) {
    const updatedMatches = userData.matches.filter((m) => m.id !== matchId);
    const previousMatches = [
      ...(userData.previousMatches || []),
      {
        ...match,
        unmatchedAt: new Date().toISOString(),
        blocked: true,
      },
    ];
    await updateDoc(userRef, { matches: updatedMatches, previousMatches });
  }

  const otherMatch = otherUserData.matches?.find((m) => m.id === matchId);
  if (otherMatch) {
    const updatedOtherMatches = otherUserData.matches.filter(
      (m) => m.id !== matchId,
    );
    const otherPreviousMatches = [
      ...(otherUserData.previousMatches || []),
      {
        ...otherMatch,
        unmatchedAt: new Date().toISOString(),
        blockedBy: userId,
      },
    ];
    await updateDoc(otherUserRef, {
      matches: updatedOtherMatches,
      previousMatches: otherPreviousMatches,
    });
  }

  const chatRef = doc(db, "chats", matchId);
  await deleteDoc(chatRef);

  return true;
};

export const cleanupUserChats = async (userId) => {
  const userRef = doc(db, "users", userId);
  const userDoc = await getDoc(userRef);

  if (userDoc.exists()) {
    const matches = userDoc.data().matches || [];

    for (const match of matches) {
      const chatRef = doc(db, "chats", match.id);
      const chatDoc = await getDoc(chatRef);

      if (chatDoc.exists()) {
        const chatData = chatDoc.data();
        if (!chatData.hasMessages) {
          await deleteDoc(chatRef);
        }
      }
    }
  }
};

export const logoutUser = async () => {
  await signOut(auth);
};

export const checkIfLikedMe = async (userId, otherUserId) => {
  const otherUserDoc = await getDoc(doc(db, "users", otherUserId));
  if (otherUserDoc.exists()) {
    const otherUserData = otherUserDoc.data();
    return (
      otherUserData.likesWithMessages?.some((like) => like.userId === userId) ||
      false
    );
  }
  return false;
};

export const getUsersWhoLikedMe = async (userId) => {
  const userDoc = await getDoc(doc(db, "users", userId));
  if (!userDoc.exists()) return [];

  const userData = userDoc.data();
  return userData.likesWithMessages || [];
};