import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import './App.css';
import abi from "./utils/WavePortal.json";

export default function App() {

  /* Store the user's public wallet */
  const [currentAccount, setCurrentAccount] = useState("");
  const [allWaves, setAllWaves] = useState([]);
  const [totalWaves, setTotalWaves] = useState(0);
  const [userWaves, setUserWaves] = useState(0);
  const [message, setMessage] = useState("This is my wave message!");
  const [topWavers, setTopWavers] = useState([]);
  const contractAddress = "0x193CDac5445aA2FbF9ABc2Aa6418C1d2262886EB";
  const contractABI = abi.abi;

  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        // Call the getAllWaves method from the Smart Contract
        const waves = await wavePortalContract.getAllWaves();

        // We only need address, timestamp, and message in our UI so let's pick those out
        let wavesCleaned = [];
        waves.forEach(wave => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message
          });
        });

        // Store data in React state
        setAllWaves(wavesCleaned);

        await getWaveCounts();

        wavePortalContract.on("NewWave", (from, timestamp, message) => {
          console.log("NewWave", from, timestamp, message);

          getWaveCounts();

          setAllWaves(prevState => [...prevState, {
            address: from,
            timestamp: new Date(timestamp * 1000),
            message:message
          }]);
        })
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error);
    }
  }

  const getWaveCounts = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
        setTotalWaves(count.toNumber());

        let userCount = await wavePortalContract.getAddrWaveCount();
        console.log("Retrieved user wave count...", userCount.toNumber());
        setUserWaves(userCount.toNumber());
        
        // Get top wavers
        const topWavers = await wavePortalContract.getTopWavers();
        let topWaversCleaned = [];
        topWavers.forEach((topWaver) => {
          console.log("Top Waver %s has waved %d times", topWaver.waver, topWaver.count.toNumber());
          topWaversCleaned.push({
            address: topWaver.waver,
            count: topWaver.count.toNumber()
          })
        })
        setTopWavers(topWaversCleaned);
      } else {
        console.log("Ethereum object doesn't exist!")
      }

    } catch(error) {
      console.log(error);
    }
  }

  const checkIfWalletIsConnected = async () => {
    try {
      /* First make sure we have access to window.ethereum */
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the etherum object", ethereum);
      }

      /* Check if we're authorized to access the user's wallet */
      const accounts = await ethereum.request({ method: 'eth_accounts' });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
        getAllWaves();
      } else {
        console.log("No authorized account found");
      }
    } catch (error) {
      console.log(error);
    }
    
  }

  /* Connect to wallet */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  }

  /* This runs our function when the page loads */
  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  const wave = async () => {
    console.log("Wave called");
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        const waveTxn = await wavePortalContract.wave(message, { gasLimit: 300000 });
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);

      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  }
  
  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
        👋 Hey there!
        </div>

        <div className="bio">
        See who can send the most waves!
        </div>

        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

        {currentAccount && (
          <>
            <div className="totalWaves">
              <div className="header">
                Total number of waves
              </div>
              <div className="totalWavesNum">
                {totalWaves}
              </div>
            </div>
            <div className="totalWaves">
              <div className="header">
                Your number of waves
              </div>
              <div className="totalWavesNum">
                {userWaves}
              </div>
            </div>
            <div className="topWavers">
              {topWavers.map((topWaver, index) => {
                return (
                  <div className="leaderboard" key={index}>
                    <div>{index === 0 ? <span>🥇</span> : index === 1 ? <span>🥈</span> : <span>🥉</span>}</div>
                    <div>Address: {topWaver.address}</div>
                    <div>Count: {topWaver.count}</div>
                  </div>
                )
              })}
            </div>
            <div className="waveForm">
              <textarea value={message} rows={4} onChange={(e) => setMessage(e.target.value)} />
              <br/>
              <button className="waveButton" onClick={wave}>
                Wave at Me
              </button>
            </div>
          </>
        )}

        {allWaves.map((wave, index) => {
          return (
            <div key={index} style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px" }}>
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
            </div>
          )
        })}
      </div>
    </div>
  );
}
