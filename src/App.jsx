// NFT INDEXER APP BY MUKTAR SADIQ FOR ALCHEMY UNIVERSITY //
import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Image,
  Input,
  SimpleGrid,
  Text,
  Spinner
} from '@chakra-ui/react';
import { Alchemy, Network } from 'alchemy-sdk';
import { useState, useEffect } from 'react';
import detectEthereumProvider from '@metamask/detect-provider';
import { ethers } from 'ethers';



function App() {
  const [userAddress, setUserAddress] = useState('');
  const [results, setResults] = useState([]);
  const [hasQueried, setHasQueried] = useState(false);
  const [tokenDataObjects, setTokenDataObjects] = useState([]);
  const [walletAddress, setWalletAddress] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);


  useEffect(() => {
    getConnectedWalletAccounts();
    walletListener();
    const storedWalletAddress = localStorage.getItem('connectedWalletAddress');
    if (storedWalletAddress) {
      setWalletAddress(storedWalletAddress);
      setUserAddress(storedWalletAddress); // Set the connected wallet address in the input field
    }
  }, [])

  const resolveENSAddress = async () => {
    try {
      const provider = new ethers.providers.JsonRpcProvider(); // Create an Ethereum provider

      // Resolve the ENS address to Ethereum address
      const resolvedAddress = await provider.resolveName(userAddress);
      setUserAddress(resolvedAddress);
    } catch (error) {
      console.error('Error resolving ENS address:', error);
      // Handle the error, such as displaying an error message to the user
    }
  };

  async function connectWallet() {
    if (typeof window !== 'undefined' && typeof window.ethereum != 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        setWalletAddress(accounts[0]);
        localStorage.setItem('connectedWalletAddress', accounts[0]);
        setUserAddress(accounts[0]);
        console.log(accounts[0]);
      }
      catch (err) {
        setErrorMessage("Failed to connect wallet. Please try again.")
        console.log(err.message);
      }
    }
    else {
      setErrorMessage("Please Install MetaMask");
      console.log('Please install MetaMask!');
    }
  }

  async function getConnectedWalletAccounts() {
    if (typeof window !== 'undefined' && typeof window.ethereum != 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          console.log(accounts[0]);
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
            localStorage.setItem('connectedWalletAddress', accounts[0]);
          }
        }
        else {

          console.log("connect to Metamask using the connect button")
        }
      }
      catch (err) {
        setErrorMessage("Failed to get connected wallet accounts. Please try again.");
        console.log(err.message);
      }
    }
    else {

      console.log('Please install MetaMask!');
    }
  }

  async function walletListener() {
    if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          localStorage.setItem('connectedWalletAddress', accounts[0]);
        } else {
          setWalletAddress("");
          setUserAddress(""); // Clear the userAddress state
          localStorage.removeItem('connectedWalletAddress');
        }
      });
    } else {
      setWalletAddress("");
      setUserAddress(""); // Clear the userAddress state
      localStorage.removeItem('connectedWalletAddress');
      console.log('Please install MetaMask!');
    }
  }

  async function getNFTsForOwner() {
    if (!userAddress) {
      setErrorMessage("Please enter a valid address.");
      return;
    }

    setIsLoading(true);
    setHasQueried(false);
    setResults([]);
    setTokenDataObjects([]);
    setErrorMessage("");

    try {
      const config = {
        apiKey: 'QnA_PmKkpDyuFaOe-5IJq9McEAKo-uhW',
        network: Network.ETH_MAINNET,
      };

      const alchemy = new Alchemy(config);
      const data = await alchemy.nft.getNftsForOwner(userAddress);
      setResults(data);

      const tokenDataPromises = [];

      for (let i = 0; i < data.ownedNfts.length; i++) {
        const tokenData = alchemy.nft.getNftMetadata(
          data.ownedNfts[i].contract.address,
          data.ownedNfts[i].tokenId
        );
        tokenDataPromises.push(tokenData);
      }

      const tokenDataResponses = await Promise.all(tokenDataPromises);
      setTokenDataObjects(tokenDataResponses);
      setHasQueried(true);
    } catch (err) {
      setErrorMessage("Failed to fetch NFTs. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }
  return (
    <Box w="100vw" position="relative">
      <Button
        fontSize={15}
        bgColor="orange"
        onClick={connectWallet}
        position="relative"
        top={10}
        left={0}
        mt={-170}
        ml={10}
      >
        {walletAddress && walletAddress.length > 0
          ? `Connected: ${walletAddress.substring(0, 7)}...${walletAddress.substring(38)}`
          : "Connect Wallet"}
      </Button>
      <Center>
        <Flex alignItems="center" justifyContent="center" flexDirection="column">
          <Heading mb={0} fontSize={36}>
            NFT Indexer 🖼
          </Heading>
          <Text>
            Plug in an address and this website will return all of its NFTs!
          </Text>
        </Flex>
      </Center>
      <Flex w="100%" flexDirection="column" alignItems="center" justifyContent="center">
        <Heading mt={42}>Get all the ERC-721 tokens of this address:</Heading>
        <Input
          value={userAddress}
          onChange={(e) => setUserAddress(e.target.value)}
          color="black"
          w="600px"
          textAlign="center"
          p={4}
          bgColor="white"
          fontSize={24}
        />
        <Button fontSize={20} onClick={getNFTsForOwner} mt={36} bgColor="blue">
          Fetch NFTs
        </Button>
        <Button fontSize={20} onClick={resolveENSAddress} mt={20} bgColor="orange">
          Resolve ENS
        </Button>

        <Heading my={36}>Here are your NFTs:</Heading>

        {isLoading ? (
          <Spinner size="xl" />
        ) : hasQueried ? (
          <SimpleGrid columns={4} spacing={8} width="90vw" mx="auto">
            {results.ownedNfts.map((e, i) => {
              return (
                <Flex flexDir="column" color="white" bg="blue" w="20vw" key={e.id}>
                  <Box>
                    <b>Name:</b>{" "}
                    {tokenDataObjects[i].title?.length === 0
                      ? "No Name"
                      : tokenDataObjects[i].title}
                  </Box>
                  <Image
                    src={
                      tokenDataObjects[i]?.rawMetadata?.image ?? "https://via.placeholder.com/200"
                    }
                    alt="Image"
                    w="100%"
                    h="200px"
                    objectFit="cover"
                  />
                </Flex>
              );
            })}
          </SimpleGrid>
        ) : (
          "Please make a query! The query may take a few seconds..."
        )}
      </Flex>
    </Box>
  );
}

export default App;
