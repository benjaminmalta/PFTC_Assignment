let signInButton = document.getElementById("signIn");
let signOutButton = document.getElementById("signOut");
let profile = document.getElementById("profile");
let signInContainer = document.getElementById("signInContainer");
let creditCount = document.getElementById("creditCounter");


function showInputField()
{
  var pathname = window.location.pathname;
  switch(pathname){
    case "/":
      document.getElementById("convertInput").style.display= "block";
      document.getElementById("convertButton").style.display= "block";
      break;
  } 
}
function toggleInputField() {
  switch (document.getElementById("convertInput").style.display) {
    case "none":
      document.getElementById("convertInput").style.display = "block";
      document.getElementById("convertButton").style.display = "block";
      document.getElementById("priceList").style.display = "none";
      document.getElementById("convertSection").style.display = "block";
      document.getElementById("adminPanel").style.display = "none";
      break;
    case "block":
      document.getElementById("convertInput").style.display = "none";
      document.getElementById("convertButton").style.display = "none";
      document.getElementById("priceList").style.display = "block";
      document.getElementById("convertSection").style.display = "none";
      document.getElementById("adminPanel").style.display = "none";
      break;
  }
}
function hideInputField()
{
  var pathname = window.location.pathname;
  switch(pathname){
    case "/":
      document.getElementById("convertInput").style.display= "none";
      document.getElementById("convertButton").style.display= "none";
      break;
  } 
}
function toggleAdminPanel()
{
  GetCreditPrices();
  switch (document.getElementById("adminPanel").style.display) {
    case "none":
      document.getElementById("convertInput").style.display = "none";
      document.getElementById("convertButton").style.display = "none";
      document.getElementById("priceList").style.display = "none";
      document.getElementById("convertSection").style.display = "none";
      document.getElementById("adminPanel").style.display = "block";
      break;
    case "block":
      document.getElementById("convertInput").style.display = "block";
      document.getElementById("convertButton").style.display = "block";
      document.getElementById("priceList").style.display = "none";
      document.getElementById("convertSection").style.display = "block";
      document.getElementById("adminPanel").style.display = "none";
      break;
  }
}

async function setPrices(){
  
  let price10 = document.getElementById("price1Input").value;
  let price20 = document.getElementById("price2Input").value;
  let price30 = document.getElementById("price3Input").value;
  

  let prices = {"buyTen":price10,"buyTwenty":price20,"buyThirty":price30};
  const url = `/setCreditPrices`; 
  const response = await axios.post(url, prices);
  //const prices = JSON.parse(response.data.creditPrices);  

  console.log(prices);

}
async function GetCreditPrices()
{  
  let price10 = document.getElementById("price1Input");
  let price20 = document.getElementById("price2Input");
  let price30 = document.getElementById("price3Input");
  const url = `/getCreditPrices`;
  const headers = {
    "Content-Type": "text/html",
    "Access-Control-Allow-Origin": "*",
  };
  const response = await axios.post(url, headers);
  const prices = JSON.parse(response.data.creditPrices);

  
  console.log("GetCreditsPrices()");
  console.log(prices);


}



const authenticateReq = async (token) => {
  const url = `/auth?token=${token}`;
  const headers = {
    "Content-Type": "text/html",
    "Access-Control-Allow-Origin": "*",
  };
  const response = await axios.post(url, headers);
  const status = response.data.status;

  if (status == 200) {
    const name = response.data.name;
    const email = response.data.email;
    const picture = response.data.picture;
    const expiry = response.data.expiry;
    profile.style.display = "inline";
    signInContainer.style.display = "none";

    document.getElementById("navbarDropdownMenuLink").innerHTML =
      `<img
    id="picture"
    src=""
    class="rounded-circle"
    style="margin-right: 5px"
    height="25"
    alt=""
    loading="lazy"
  />` + name;
    if(response.data.admin)
    {
      document.getElementById("home-container").innerHTML = `<button type="button" class="btn btn-primary" onclick="toggleAdminPanel()" >Admin Panel</button>`;
    }
    showInputField();
    creditCount.style.display = "inline";
    creditCount.style.marginRight ="10px"
    creditCount.innerText = `Credits: ${response.data.credits}`;
    //document.getElementById("picture").src = picture;
   
    let date = new Date();
    date.setTime(date.getTime() + expiry)
    document.cookie = `token=${token};expires=${date.toUTCString()}`;
    
    console.log(`${name} signed in successfully.`);
  } else {
    profile.style.display = "none";
    signInContainer.style.display = "inline";
  }
};

async function loadGoogleLogin() {
  let session = document.cookie;
  if (session && session.includes("token")) {
    authenticateReq(session.split("token=")[1].split(";")[0]);
  } else {
    profile.style.display = "none";
    signInContainer.style.display = "inline";
  }

  const signOut = () => {
    let auth2 = gapi.auth2.getAuthInstance();
    document.getElementById("home-container").innerHTML = ``;
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    auth2
      .signOut()
      .then(() => {
        profile.style.display = "none";
        signInContainer.style.display = "inline";
        console.log("User signed out.");
      })
      .catch((error) => alert(error));
  };

  signOutButton.addEventListener("click", () => signOut());

  gapi.load("auth2", () => {
    // Retrieve the singleton for the GoogleAuth library and set up the client.
    let auth2 = gapi.auth2.init({
      client_id:
        "88778565218-5kb5no6mb9dbulon762qjcrdn9cmoogj.apps.googleusercontent.com",
      cookiepolicy: "single_host_origin",
      scope: "profile",
    });

    auth2.attachClickHandler(
      signInButton,
      {},
      function (googleUser) {
        authenticateReq(googleUser.getAuthResponse().id_token);
      },
      function (error) {
        alert(
          "Error: " + JSON.parse(JSON.stringify(error, undefined, 2)).error
        );
      }
    );
  });
}

