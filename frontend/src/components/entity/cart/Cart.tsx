import { Link } from 'react-router-dom';
import { useCart } from '../../../context/CartContext';
import { useTheme } from '../../../context/ThemeContext';

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export default function Cart() {
  const { items, subtotal, shipping, grandTotal, updateQuantity, removeItem, clearCart } =
    useCart();
  const { darkMode } = useTheme();

  const panelClassName = darkMode
    ? 'bg-gray-900 border-gray-700 text-light'
    : 'bg-white border-gray-200 text-gray-900';
  const tableHeaderClassName = darkMode ? 'bg-gray-800 text-light' : 'bg-gray-100 text-gray-900';

  if (items.length === 0) {
    return (
      <div
        className={`min-h-screen ${darkMode ? 'bg-dark' : 'bg-gray-100'} pt-24 pb-16 px-4 transition-colors duration-300`}
      >
        <div className="max-w-5xl mx-auto rounded-2xl border border-dashed border-primary/60 p-10 text-center">
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-light' : 'text-gray-800'}`}>Your Cart</h1>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-4`}>
            Your cart is currently empty.
          </p>
          <Link
            to="/products"
            className="inline-flex mt-8 bg-primary hover:bg-accent text-white px-6 py-3 rounded-full font-semibold transition-colors"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${darkMode ? 'bg-dark' : 'bg-gray-100'} pt-24 pb-16 px-4 transition-colors duration-300`}
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-4 gap-6">
        <section className={`xl:col-span-3 rounded-2xl border overflow-hidden ${panelClassName}`}>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className={tableHeaderClassName}>
                <tr>
                  <th className="p-4 text-left font-semibold">S. No.</th>
                  <th className="p-4 text-left font-semibold">Product Image</th>
                  <th className="p-4 text-left font-semibold">Product Name</th>
                  <th className="p-4 text-left font-semibold">Unit Price</th>
                  <th className="p-4 text-left font-semibold">Quantity</th>
                  <th className="p-4 text-left font-semibold">Total</th>
                  <th className="p-4 text-left font-semibold">Remove</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const unitPrice =
                    item.product.discount && item.product.discount > 0
                      ? item.product.price * (1 - item.product.discount)
                      : item.product.price;
                  const lineTotal = unitPrice * item.quantity;

                  return (
                    <tr
                      key={item.product.productId}
                      className={`border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}
                    >
                      <td className="p-4 font-semibold">{index + 1}</td>
                      <td className="p-4">
                        <img
                          src={`/${item.product.imgName}`}
                          alt={item.product.name}
                          className="h-20 w-24 object-contain"
                        />
                      </td>
                      <td className="p-4 font-semibold">{item.product.name}</td>
                      <td className="p-4 font-semibold">{formatCurrency(unitPrice)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              updateQuantity(item.product.productId, Math.max(1, item.quantity - 1))
                            }
                            className={`h-9 w-9 rounded-lg border ${darkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-100'} transition-colors`}
                            aria-label={`Decrease quantity for ${item.product.name}`}
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(event) => {
                              const parsedQuantity = Number(event.target.value);
                              if (Number.isInteger(parsedQuantity) && parsedQuantity >= 1) {
                                updateQuantity(item.product.productId, parsedQuantity);
                              }
                            }}
                            className={`w-14 h-10 rounded-lg border text-center ${darkMode ? 'bg-gray-800 border-gray-700 text-light' : 'bg-white border-gray-300 text-gray-900'}`}
                            aria-label={`Quantity for ${item.product.name}`}
                          />
                          <button
                            onClick={() => updateQuantity(item.product.productId, item.quantity + 1)}
                            className={`h-9 w-9 rounded-lg border ${darkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-100'} transition-colors`}
                            aria-label={`Increase quantity for ${item.product.name}`}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="p-4 font-semibold">{formatCurrency(lineTotal)}</td>
                      <td className="p-4">
                        <button
                          onClick={() => removeItem(item.product.productId)}
                          className="text-primary hover:text-accent transition-colors"
                          aria-label={`Remove ${item.product.name} from cart`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            className="h-6 w-6"
                          >
                            <path d="M3 6h18" strokeLinecap="round" />
                            <path d="M8 6V4h8v2" strokeLinecap="round" />
                            <path d="M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M10 11v6M14 11v6" strokeLinecap="round" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className={`border-t p-4 ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
            <div className="flex flex-col sm:flex-row gap-3 justify-between">
              <div className="flex flex-1 max-w-xl">
                <input
                  type="text"
                  placeholder="Coupon Code"
                  className={`flex-1 rounded-l-full px-4 py-2 border ${darkMode ? 'bg-gray-800 border-gray-700 text-light' : 'bg-white border-gray-300 text-gray-900'}`}
                  aria-label="Coupon code"
                />
                <button
                  type="button"
                  className="bg-primary hover:bg-accent text-white px-6 py-2 rounded-r-full font-semibold transition-colors"
                >
                  Apply Coupon
                </button>
              </div>
              <button
                type="button"
                className="bg-primary hover:bg-accent text-white px-8 py-2 rounded-full font-semibold transition-colors"
              >
                Update Cart
              </button>
            </div>
          </div>
        </section>

        <aside className={`rounded-2xl border overflow-hidden ${panelClassName} h-fit`}>
          <div className={`px-6 py-5 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
            <h2 className="text-4xl font-semibold">Order Summary</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex justify-between text-lg">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span>Shipping (Free over $100)</span>
              <span>{formatCurrency(shipping)}</span>
            </div>
            <div className={`pt-4 mt-2 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
              <div className="flex justify-between text-2xl font-semibold">
                <span>Grand Total</span>
                <span>{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>
          <div className={`p-6 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
            <button
              type="button"
              className="w-full bg-primary hover:bg-accent text-white py-3 rounded-full text-lg font-semibold transition-colors"
            >
              Proceed To Checkout
            </button>
            <button
              type="button"
              onClick={clearCart}
              className={`w-full mt-3 py-2 rounded-full border transition-colors ${darkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-100'}`}
            >
              Clear Cart
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
