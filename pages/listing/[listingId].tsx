import { UserCircleIcon } from "@heroicons/react/24/solid";
import {
  MediaRenderer,
  useBuyNow,
  useContract,
  useListing,
  useMakeOffer,
  useNetwork,
  useNetworkMismatch,
  useOffers,
  useMakeBid,
  useAddress,
  useAcceptDirectListingOffer,
} from "@thirdweb-dev/react";
import { ListingType, NATIVE_TOKENS } from "@thirdweb-dev/sdk";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import Header from "../../components/Header";
import Countdown from "react-countdown";
import network from "../../utils/network";
import { ethers } from "ethers";
import toast, { Toaster } from "react-hot-toast";

type Props = {};

function listingId({}: Props) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [bidAmout, setBidAmount] = useState("");
  const [, switchNetwork] = useNetwork();
  const networkMismatch = useNetworkMismatch();
  const router = useRouter();
  const [minNextBid, setMinNextBid] = useState<{
    displayValue: string;
    symbol: string;
  }>();

  const { listingId } = router.query as { listingId: string };
  const { contract } = useContract(
    process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT,
    "marketplace"
  );
  const { mutate: buyNow } = useBuyNow(contract);
  const { data: offers } = useOffers(contract, listingId);
  const { mutate: makeOffer } = useMakeOffer(contract);
  const { mutate: makeBid } = useMakeBid(contract);
  const address = useAddress();

  const { mutate: acceptOffer } = useAcceptDirectListingOffer(contract);

  const {
    data: listing,
    isLoading: listLoading,
    error,
  } = useListing(contract, listingId);

  useEffect(() => {
    if (!contract || !listingId || !listing) return;

    if (listing.type === ListingType.Auction) {
      fetchMinNextBid();
    }
  }, [contract, listing, listingId]);

  const fetchMinNextBid = async () => {
    if (!contract || !listingId) return;

    const { displayValue, symbol } = await contract.auction.getMinimumNextBid(
      listingId
    );

    setMinNextBid({
      displayValue: displayValue,
      symbol: symbol,
    });
  };

  const buyNft = async () => {
    console.log("buttn pressedd");
    if (networkMismatch) {
      switchNetwork && switchNetwork(network);
      return;
    }

    if (!listing || !listingId || !contract) return;

    await buyNow(
      {
        buyAmount: 1,
        id: listingId,
        type: listing.type,
      },
      {
        onSuccess(data, variables, context) {
          toast.success("Successfully Bought NFT");
          console.log("Success", data);
          setIsLoading(false);

          router.replace("/");
        },
        onError(error, variables, context) {
          console.log("Error", error);
          toast.error("This is an error!");
          setIsLoading(false);
        },
      }
    );
  };

  const createBidOrOffer = async () => {
    setIsLoading(true);
    // toast.loading("Loading...");

    try {
      if (networkMismatch) {
        switchNetwork && switchNetwork(network);
        return;
      }

      //Direct Listing
      if (listing?.type === ListingType.Direct) {
        if (
          listing.buyoutPrice.toString() ===
          ethers.utils.parseEther(bidAmout).toString()
        ) {
          console.log("Buyout price met, buying NFT...");
          buyNft();
          return;
        }

        console.log("Buyout price not met, making offer...");
        await makeOffer(
          {
            quantity: 1,
            listingId,
            pricePerToken: bidAmout,
          },
          {
            onSuccess(data, variables, context) {
              toast.success("Offer made successfully!");

              console.log("Success", data);
              setIsLoading(false);

              setBidAmount("");
            },
            onError(error, variables, context) {
              toast.error("This is an error!");
              console.log("Error: OFfer could not be made", error);
              setIsLoading(false);
            },
          }
        );
      }

      //Auction Listing
      if (listing?.type === ListingType.Auction) {
        console.log("Making Bid...");
        await makeBid(
          { listingId, bid: bidAmout },
          {
            onSuccess(data, variables, context) {
              toast.success("Bid made successfully!");

              console.log("Success", data);
              setIsLoading(false);

              setBidAmount("");
            },
            onError(error, variables, context) {
              toast.error("This is an error!");
              console.log("Error", error);
              setIsLoading(false);
            },
          }
        );
      }
    } catch (error) {
      console.error(error);
      toast.error("Error!");
      setIsLoading(false);
    }
  };

  const formatePlaceholder = () => {
    if (!listing) return;
    if (listing?.type === ListingType.Direct) {
      return "Enter Offer Amout";
    }
    if (listing?.type === ListingType.Auction) {
      return Number(minNextBid?.displayValue) === 0
        ? "Enter Bid Amout"
        : `${minNextBid?.displayValue} ${minNextBid?.symbol} or more`;
    }
  };

  if (listLoading) {
    return (
      <div>
        <Header />
        <p className="text-center animate-pulse text-blue-500">Loading...</p>
      </div>
    );
  }
  if (!listing) {
    return (
      <div>
        <Header />
        <p className="text-center animate-bounce text-black">
          Listing not found
        </p>
      </div>
    );
  }

  // if (isLoading) {
  //   toast.loading("Loading...");
  // }

  return (
    <div>
      <Header />
      <main className="max-w-6xl mx-auto p-2 flex flex-col lg:flex-row space-y-10 space-x-5 pr-10">
        <div className="p-10 border mx-auto lg:mx-0 max-w-md lg:max-w-lg">
          <MediaRenderer src={listing.asset.image} />
        </div>

        <section className="flex-1 space-y-5 pb-20 lg:pb-0">
          <div>
            <h1 className="text-xl font-bold">{listing.asset.name}</h1>
            <p className="text-gray-600">{listing.asset.description}</p>
            <p className="flex items-center text-xs sm:text-base">
              <UserCircleIcon className="h-5" />
              <span className="font-bold pr-1">Seller: </span>
              {listing.sellerAddress}
            </p>
          </div>

          <div className="grid grid-cols-2 items-center py-2">
            <p className="font-bold">Listing Type:</p>
            <p className="">
              {listing.type === ListingType.Direct
                ? "Direct Listing"
                : "Auction Listing"}
            </p>
            <p className="font-bold">Buy it Now Price:</p>
            <p className="text-2xl font-bold">
              {listing.buyoutCurrencyValuePerToken.displayValue}{" "}
              {listing.buyoutCurrencyValuePerToken.symbol}
            </p>
            {!isLoading && (
              <button
                className="col-start-2 mt-2 bg-blue-600 font-bold text-white rounded-full w-44 py-4 px-10"
                onClick={buyNft}
              >
                Buy Now
              </button>
            )}
          </div>

          {listing.type === ListingType.Direct && offers && (
            <div className="grid grid-cols-2 gap-y-2">
              <p className="font-bold">Offers: </p>
              <p className="font-bold">
                {offers.length > 0 ? offers.length : 0}
              </p>
              {offers.map((offer) => (
                <>
                  <p className="flex items-center ml-5 text-sm italic">
                    <UserCircleIcon className="h-3 mr-2" />
                    {offer.offeror.slice(0, 5) +
                      "..." +
                      offer.offeror.slice(-5)}
                  </p>
                  <div>
                    <p
                      key={
                        offer.listingId +
                        offer.offeror +
                        offer.totalOfferAmout.toString()
                      }
                      className="text-sm italic"
                    >
                      {ethers.utils.formatEther(offer.totalOfferAmout)}{" "}
                      {NATIVE_TOKENS[network].symbol}
                    </p>

                    {listing.sellerAddress === address && (
                      <>
                        {!isLoading && (
                          <button
                            className="p-2 w-32 bg-red-500/50 rounded-lg font-bold text-xs cursor-pointer"
                            onClick={() =>
                              acceptOffer(
                                {
                                  addressOfOfferor: offer.offeror,
                                  listingId,
                                },
                                {
                                  onSuccess(data, variables, context) {
                                    toast.success(
                                      "Offer accepted successfully!"
                                    );

                                    console.log("Success", data);
                                    router.replace("/");
                                  },
                                  onError(error, variables, context) {
                                    toast.error("This is an error!");
                                    console.log(
                                      "Error: OFfer could not be made",
                                      error
                                    );
                                  },
                                }
                              )
                            }
                          >
                            Accept Offer
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 space-y-2 items-center justify-end">
            <hr className="col-span-2" />

            <p className="col-span-2 font-bold">
              {listing.type === ListingType.Direct
                ? "Make an Offer"
                : "Bid on this Auction"}
            </p>

            {listing.type === ListingType.Auction && (
              <>
                <p>Current Minimum Bid</p>
                <p className="font-bold">
                  {minNextBid?.displayValue} {minNextBid?.symbol}
                </p>
                <p>Time Remaining</p>
                <p>
                  <Countdown
                    date={
                      Number(listing.endTimeInEpochSeconds.toString()) * 1000
                    }
                  />
                </p>
              </>
            )}

            <input
              className="border p-2 rounded-lg mr-55"
              type="text"
              placeholder={formatePlaceholder()}
              onChange={(e) => setBidAmount(e.target.value)}
            />
            {!isLoading && (
              <button
                onClick={createBidOrOffer}
                className="bg-red-600 text-white font-bold rounded-full w-44 py-4 px-10"
              >
                {listing.type === ListingType.Direct ? "Offer" : "Bid"}
              </button>
            )}
          </div>
        </section>
      </main>
      <Toaster />
    </div>
  );
}

export default listingId;
