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
      const currentShoe = cart.find((product) => product.id === productId);
      if (!currentShoe) {
        api
          .get<Product>(`/products/${productId}`)
          .then((response) => {
            const { id, title, image, price } = response.data;

            setCart([ ...cart, { id, title, image, price, amount: 1 } ]);

            localStorage.setItem(
              "@RocketShoes:cart",
              JSON.stringify([ ...cart, { id, title, image, price, amount: 1 } ])
            );
          })
          .catch(() => {
            toast.error("Ocorreu um erro ao adicionar o produto!");
          });
      } else {
        updateProductAmount({
          productId,
          amount: currentShoe.amount + 1,
        });
      }
    } catch {
      toast.error("Ocorreu um erro ao adicionar o produto!");
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
      const currentCar = cart;
      const currentShoeIndex = currentCar.findIndex( (product) => product.id === productId );
      const currentShoe = currentCar[currentShoeIndex];

      if (amount > currentShoe.amount) {
        const stock = await api.get<Stock>(`/stock/${productId}`);

        if (currentShoe.amount + 1 <= stock.data.amount) {
          currentShoe.amount += 1;
          setCart([...currentCar]);

          localStorage.setItem(
            "@RocketShoes:cart",
            JSON.stringify([...currentCar])
          );

        } else {
          toast.error("Produto esgotado!");
        }
      } else {
        if (currentShoe.amount - 1 === 0) {
          throw new Error();
        } else {
          currentShoe.amount -= 1;

          setCart([...currentCar]);

          localStorage.setItem(
            "@RocketShoes:cart",
            JSON.stringify([...currentCar])
          );
        }
      }

      if (currentShoeIndex === -1) {
        throw new Error();
      }

    } catch {
      toast.error("Erro ocorreu.");
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
