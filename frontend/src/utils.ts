import toast from 'react-hot-toast';

export async function copyToClipboard(text: string) {
  await navigator.clipboard
    .writeText(text)
    .then(() => toast.success('room id copied'))
    .catch(() => toast.error("couldn't copy room id"));
}
