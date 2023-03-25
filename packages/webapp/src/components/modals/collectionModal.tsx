import { useRouter } from 'next/router';

export const CollectionGameModal = () => {

  const router = useRouter();
  const handleClick = () => {
    router.push('/collection');
  };

  return (
    <>
      <label
        htmlFor="collection"
        className="hover:border-3 btn-lg btn border-2 border-green-900 text-2xl normal-case hover:scale-105 hover:border-green-800"
        onClick={() => handleClick()}
      >
        Collection →
      </label>

      

    </>
  );
};
