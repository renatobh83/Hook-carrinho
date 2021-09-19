import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const { data } = await api.get(`stock/${productId}`);
      const updateCart = [...cart];
      const productInCart = cart.find((product) => product.id === productId);
      const productQuantity = productInCart ? productInCart.amount : 0;
      const amount = productQuantity + 1;

      if (amount > data.amount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      if (productInCart) {
        productInCart.amount = amount;
      } else {
        const product = await api.get(`products/${productId}`);

        const newProductInCart = {
          ...product.data,
          amount: 1,
        };
        updateCart.push(newProductInCart);
      }
      setCart(updateCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updateCart));
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productsInCart = [...cart];
      const indexProduct = productsInCart.findIndex(
        (product) => product.id === productId
      );
      if (indexProduct >= 0) {
        productsInCart.splice(indexProduct, 1);

        setCart(productsInCart);
        localStorage.setItem(
          "@RocketShoes:cart",
          JSON.stringify(productsInCart)
        );
      } else {
        throw new Error();
      }
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return;
      }
      const { data } = await api.get(`stock/${productId}`);
      const totalStock = data.amount;
      if (amount > totalStock) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }
      const updateCart = [...cart];
      const isExists = updateCart.find((product) => product.id === productId);
      if (isExists) {
        isExists.amount = amount;
        setCart(updateCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(updateCart));
      } else {
        throw Error();
      }
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
