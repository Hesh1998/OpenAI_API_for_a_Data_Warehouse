const chatInput = document.querySelector("#chat-input");
const sendButton = document.querySelector("#send-btn");
const chatContainer = document.querySelector(".chat-container");
const themeButton = document.querySelector("#theme-btn");

let userText = null;


// Refreshes the web page
const refreshPage = () => {
    const themeColor = "dark_mode";
    
    document.body.classList.toggle("light-mode", themeColor === "light_mode");
    themeButton.innerText = document.body.classList.contains("light-mode") ? "dark_mode" : "light_mode";

    const defaultText = `<div class="default-text">
                            <h1>SalesGPT</h1>
                            <h2>Powered by OpenAI GPT 3.5 Turbo Model</h2>
                            <p>Start a conversation and explore insights from the Sales Data Warehouse.<br> Your chat history will be displayed here.</p>
                        </div>`

    chatContainer.innerHTML = defaultText;
}


// Create new div and apply chat, specified class and set html content of div
const createChatElement = (content, className) => {
    const chatDiv = document.createElement("div");
    chatDiv.classList.add("chat", className);
    chatDiv.innerHTML = content;
    return chatDiv; // Return the created chat div
}


// Creates an API call to the endpoint in the Python backend with the user request
// Gets the response
// And adds the response to the chat
const getChatResponse = async (incomingChatDiv) => {
    var divElement = document.createElement("div");

    // Creates a JSON object with the user request
    var object = {};
    object["request"] = userText;
    var jsonText = JSON.stringify(object);


    // Creates an API call to the endpoint in the Python backend with the user request
    // Gets the response
    // Appends the response in tabular format to the chat
    await fetch("http://127.0.0.1:5000/search-dwh", {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: jsonText
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Function to convert a JSON object to a multi-dimensional array
            function convertToMultiArray(obj) {
                const result = [];

                for (const key in obj) {
                    if (obj.hasOwnProperty(key)) {
                    const value = obj[key];

                    if (typeof value === 'object' && value !== null) {
                        // Recursively convert nested objects
                        result.push([key, convertToMultiArray(value)]);
                    } else {
                        // Add key-value pair to the array
                        result.push([key, value]);
                    }
                    }
                }

                return result;
            }


            // Convert JSON object (response from Python backend) to a multi-dimensional array
            // And based on this multi-dimensional array create an HTML table and display in the web page
            const dataArr = convertToMultiArray(data);
            
            var noOfColumns = dataArr[0][1].length;
            var noOfRows = dataArr.length;

            var innerHTMLVal = '';
            innerHTMLVal = innerHTMLVal + '<div><table>';

            if(noOfRows >= 1 && noOfColumns >= 1){
                
                // Sets the table headings (column names)
                innerHTMLVal = innerHTMLVal + '<tr>';
                for (let i = 0; i < noOfColumns; i++) {
                    innerHTMLVal = innerHTMLVal + '<th>' + dataArr[0][1][i][0] + '</th>'; 
                }
                innerHTMLVal = innerHTMLVal + '</tr>';

                // Sets values for table rows
                for (let i = 0; i < noOfRows; i++) {
                    innerHTMLVal = innerHTMLVal + '<tr>';
                    for(let j = 0; j < noOfColumns; j++){
                        innerHTMLVal = innerHTMLVal + '<td>' + dataArr[i][1][j][1] + '</td>';
                    }
                    innerHTMLVal = innerHTMLVal + '</tr>';
                }
            }

            // Remove the typing animation and append the div element to the chat
            incomingChatDiv.querySelector(".typing-animation").remove();
            innerHTMLVal = innerHTMLVal + '</table></div>';
            divElement.innerHTML = innerHTMLVal;
            incomingChatDiv.querySelector(".chat-details").appendChild(divElement);
            chatContainer.scrollTo(0, chatContainer.scrollHeight);
            
        })
        .catch(error => console.log('Authorization failed: ' + error.message));
}


// Copy the text content of the response to the clipboard
const copyResponse = (copyBtn) => {
    const reponseTextElement = copyBtn.parentElement.querySelector("p");
    navigator.clipboard.writeText(reponseTextElement.textContent);
    copyBtn.textContent = "done";
    setTimeout(() => copyBtn.textContent = "content_copy", 1000);
}


// Display the typing animation and call the getChatResponse function
const showTypingAnimation = () => {    
    const html = `<div class="chat-content">
                    <div class="chat-details">
                        <img src="images/chatbot.png" alt="chatbot-img">
                        <div class="typing-animation">
                            <div class="typing-dot" style="--delay: 0.2s"></div>
                            <div class="typing-dot" style="--delay: 0.3s"></div>
                            <div class="typing-dot" style="--delay: 0.4s"></div>
                        </div>
                    </div>
                    <span onclick="copyResponse(this)" class="material-symbols-rounded">content_copy</span>
                </div>`;
    
    // Create an incoming chat div with typing animation and append it to chat container
    const incomingChatDiv = createChatElement(html, "incoming");
    chatContainer.appendChild(incomingChatDiv);
    chatContainer.scrollTo(0, chatContainer.scrollHeight);
    getChatResponse(incomingChatDiv);
}


// Initial handling of a user request
const handleOutgoingChat = () => {
    userText = chatInput.value.trim(); // Get chatInput value and remove extra spaces
    if(!userText) return; // If chatInput is empty return from here

    // Clear the input field and reset its height
    chatInput.value = "";
    chatInput.style.height = `${initialInputHeight}px`;

    const html = `<div class="chat-content">
                    <div class="chat-details">
                        <img src="images/user.png" alt="user-img">
                        <p>${userText}</p>
                    </div>
                </div>`;

    // Create an outgoing chat div with user's message and append it to chat container
    const outgoingChatDiv = createChatElement(html, "outgoing");
    chatContainer.querySelector(".default-text")?.remove();
    chatContainer.appendChild(outgoingChatDiv);
    chatContainer.scrollTo(0, chatContainer.scrollHeight);
    setTimeout(showTypingAnimation, 500);
}


// Toggle body's class for the theme mode
themeButton.addEventListener("click", () => {
    document.body.classList.toggle("light-mode");
    themeButton.innerText = document.body.classList.contains("light-mode") ? "dark_mode" : "light_mode";
});


const initialInputHeight = chatInput.scrollHeight;

// Adjust the height of the input field dynamically based on its content
chatInput.addEventListener("input", () => {   
    chatInput.style.height =  `${initialInputHeight}px`;
    chatInput.style.height = `${chatInput.scrollHeight}px`;
});


// If the Enter key is pressed without Shift and the window width is larger 
// than 800 pixels, handle the outgoing chat
chatInput.addEventListener("keydown", (e) => {    
    if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 800) {
        e.preventDefault();
        handleOutgoingChat();
    }
});


refreshPage();
sendButton.addEventListener("click", handleOutgoingChat);