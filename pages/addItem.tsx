import { useAddress, useContract } from "@thirdweb-dev/react";
import { useRouter } from "next/router";
import React, { FormEvent, useLayoutEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import Header from "../components/Header";

type Props = {};

function addItem({}: Props) {
  const address = useAddress();
  const [preview, setPreivew] = useState<string>();
  const [image, setImage] = useState<File>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();

  const { contract } = useContract(
    process.env.NEXT_PUBLIC_COLLECTION_CONTRACT,
    "nft-collection"
  );

  console.log(contract);

  const mintNFT = async (e: FormEvent<HTMLFormElement>) => {
    setIsLoading(true);
    e.preventDefault();
    if (!contract || !address) return;

    if (!image) {
      // alert("Please select an image");
      toast.error("Please select an image");
      console.log("Please select an image");
      return;
    }
    toast.loading("Loading...");
    const target = e.target as typeof e.target & {
      name: { value: string };
      description: { value: string };
    };

    const metadata = {
      name: target.name.value,
      description: target.description.value,
      image: image,
    };

    try {
      const tx = await contract.mintTo(address, metadata);
      const reciept = tx.receipt;
      const tokenId = tx.id;
      const nft = tx.data();

      console.log(reciept, tokenId, nft);
      router.push("/");
      setIsLoading(false);
    } catch (error) {
      console.log(error);
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Header />

      <main className="max-w-6xl mx-auto p-10 border">
        <h1 className="text-4xl font-bold">Add an Item to the Marketplace</h1>
        <h2 className="text-xl font-semibold pt-5">Item Details</h2>
        <p className="pb-5">
          By adding an item to the marketplace, you're essentially Minting an
          NFT of the item into your wallet which we can then list for sale!
        </p>

        <div className="flex flex-col justify-center items-center md:flex-row md:space-x-5 pt-5">
          <img
            className="border h-80 w-80 object-contain"
            src={preview || "https://links.papareact.com/ucj"}
            alt=""
          />

          <form
            onSubmit={mintNFT}
            className="flex flex-col flex-1 p-2 space-y-2"
          >
            <label className="font-light">Name of Item</label>
            <input
              className="formField"
              placeholder="Name of item..."
              type="text"
              name="name"
              id="name"
            />

            <label className="font-light">Descriptionm</label>
            <input
              className="formField"
              placeholder="Enter Description..."
              type="text"
              name="description"
              id="description"
            />

            <label className="font-light">Image of Item</label>
            <input
              type="file"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setPreivew(URL.createObjectURL(e.target.files[0]));
                  setImage(e.target.files[0]);
                }
              }}
            />

            {!isLoading && (
              <button
                type="submit"
                className="bg-blue-600 font-bold text-white rounded-full py-4 px-10 w-56  md:mt-auto mx-auto mt-5 md:ml-auto"
              >
                Add/Mint Item
              </button>
            )}
          </form>
          <Toaster />
        </div>
      </main>
    </div>
  );
}

export default addItem;
