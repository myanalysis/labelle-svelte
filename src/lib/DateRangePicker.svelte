<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { Instance } from 'flatpickr/dist/types/instance';
  import 'flatpickr/dist/flatpickr.min.css';

  interface Props {
    checkin: string;
    checkout: string;
    class?: string;
  }

  let { checkin = $bindable(''), checkout = $bindable(''), class: cls = '' }: Props = $props();

  let inputEl: HTMLInputElement;
  let fp: Instance | null = null;

  // toISOString() converts to UTC, which shifts the date back a day in any
  // timezone behind UTC. flatpickr dates are local-midnight — format from
  // local components instead.
  function toLocalISODate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  onMount(async () => {
    const flatpickr = (await import('flatpickr')).default;

    fp = flatpickr(inputEl, {
      mode: 'range',
      dateFormat: 'Y-m-d',
      altInput: true,
      altFormat: 'M j, Y',
      minDate: 'today',
      conjunction: ' → ',
      onChange(dates) {
        checkin  = dates[0] ? toLocalISODate(dates[0]) : '';
        checkout = dates[1] ? toLocalISODate(dates[1]) : '';
      },
    });
  });

  onDestroy(() => fp?.destroy());
</script>

<input bind:this={inputEl} placeholder="Select check-in → check-out" readonly class={cls} />
