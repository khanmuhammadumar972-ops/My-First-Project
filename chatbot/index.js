const chatbox = document.getElementById("chatbox");

function addMessage(sender, message) {
  const msg = document.createElement("p");

  if (sender === "user") {
    msg.className = "user";
    msg.innerHTML = "<b>You:</b> " + message;
  } else {
    msg.className = "bot";
    msg.innerHTML = "<b>Bot:</b> " + message;
  }

  chatbox.appendChild(msg);
  chatbox.scrollTop = chatbox.scrollHeight;
}

function getBotReply(text) {
  text = text.toLowerCase();

  if (text === "hello" || text === "hi") {
    const replies = [
      "Hello! Kaise ho? Aaj ka din kaisa ja raha hai?",
      "Hi! Main aapka chatbot hoon. Aap mujhse koi bhi basic sawal pooch sakte ho.",
      "Assalamualaikum! Khush aamdeed 😊 Bataiye main aapki kis tarah madad kar sakta hoon?"
    ];

    return replies[Math.floor(Math.random() * replies.length)];
  }

  if (text === "how are you") {
    return "Main bilkul theek hoon 😊 Shukriya poochne ke liye. Aap sunao, aap kaise ho?";
  }

  if (text === "bye") {
    return "Allah Hafiz 👋 Apna khayal rakhna. Phir baat hogi!";
  }

  return "Sorry, mujhe aapki baat samajh nahi aayi. Aap simple words mein dobara likh kar dekhein.";
}

function sendMessage() {
  const input = document.getElementById("userInput");
  const userText = input.value.trim();

  if (userText === "") return;

  addMessage("user", userText);

  const reply = getBotReply(userText);

  setTimeout(() => {
    addMessage("bot", reply);
  }, 500);

  input.value = "";
}

function handleKey(event) {
  if (event.key === "Enter") {
    sendMessage();
  }
}