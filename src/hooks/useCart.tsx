import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

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
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const newCart = [...cart];

      const stockAmount = await api.get(`stock/${productId}`).then(response => (response.data.amount));
      const currentAmount = newCart.find(product => product.id === productId)?.amount || 0;

      if (stockAmount <= currentAmount) {
        toast.error('Produto esgotado.');

        return;
      }

      const currentProduct = newCart.find(product => product.id === productId);

      if (currentProduct) {
        currentProduct.amount = currentAmount + 1;
      } else {
        const product = await api.get(`products/${productId}`).then(response => (response.data));

        newCart.push({ ...product, amount: 1 });
      }

      setCart(newCart);

    } catch {
      toast.error('Erro ao adicionar produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const currentShoe = cart.find((product) => product.id === productId)!;
      const newCart = cart.filter((product) => product.id !== currentShoe.id);

      setCart([...newCart]);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify([...newCart]));
    } catch {
      toast.error("Erro ao remover o produto!");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {

        throw new Error();
      }

      const stockAmount = await api.get(`stock/${productId}`).then(response => (response.data.amount));

      if (stockAmount < amount) {
        toast.error('Produtos fora de estoque.');

        return;
      }

      const newCart = [...cart];
      const currentShoe = newCart.find(product => product.id === productId);

      if (currentShoe) {
        currentShoe.amount = amount;

        setCart(newCart);
      } else {
        throw new Error();
      }

    } catch {
      toast.error('Erro ao atualizar carrinho.');
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
