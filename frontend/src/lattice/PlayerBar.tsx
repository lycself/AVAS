// Replay controls for a finished envelope: play / pause, position, speed and
// whether the bunch moves at uniform speed in z or with the beam's time of flight.
// One replay runs at a time (bunchPlayer); every view showing the bunch follows it.
import { Button, cx, IconButton, Segmented, Select } from "../components/ui";
import { useT } from "../i18n";
import { REPLAY_SPEEDS, setReplay, startReplay, stopReplay, usePlayer, type BunchFrame, type Track } from "./bunchPlayer";

type Props = {
  /** identifies the replayed data (a new id starts from the beginning) */
  id: string;
  label: string;
  track: Track | null;
  restMass?: number | null;
  kind?: BunchFrame["kind"];
  compact?: boolean;
  className?: string;
  /** called when the replay is started from this bar */
  onStart?: () => void;
};

export function PlayerBar({ id, label, track, restMass, kind, compact, className, onStart }: Props) {
  const t = useT();
  const replay = usePlayer((s) => s.replay);
  const mine = replay?.id === id;
  const usable = !!track && track.z.length > 1;

  if (!mine) {
    return (
      <Button
        small
        variant="ghost"
        icon="play-circle"
        className={className}
        disabled={!usable}
        onClick={() => {
          if (!track) return;
          startReplay(id, label, track, { restMass, kind });
          onStart?.();
        }}
        tip={t("Replay: a schematic bunch travels along the beam line with the envelope of {label}", { label })}
      >
        {t("Replay")}
      </Button>
    );
  }

  return (
    <div className={cx("player-bar", compact && "compact", className)}>
      <IconButton
        icon={replay.playing ? "debug-pause" : "debug-start"}
        tip={replay.playing ? t("Pause") : t("Play")}
        onClick={() => setReplay({ playing: !replay.playing })}
      />
      <input
        className="player-progress"
        type="range"
        min={0}
        max={1000}
        value={Math.round(replay.progress * 1000)}
        onChange={(e) => setReplay({ progress: Number(e.target.value) / 1000, playing: false })}
        aria-label={t("Replay position")}
      />
      <Select<number> value={replay.speed} options={REPLAY_SPEEDS.map((s) => ({ value: s, label: `${s}×` }))} onChange={(v) => setReplay({ speed: v })} tip={t("Replay speed")} />
      {!compact && (
        <Segmented
          value={replay.timeMode}
          onChange={(v) => setReplay({ timeMode: v })}
          options={[
            { value: "z", label: t("uniform"), tip: t("The bunch moves at constant speed along z") },
            {
              value: "beta",
              label: t("beam velocity"),
              tip: replay.tau ? t("The bunch moves with the beam's time of flight: slowly where β is small") : t("Needs the rest mass from beam.txt"),
            },
          ]}
        />
      )}
      <IconButton icon="close" tip={t("End the replay")} onClick={stopReplay} />
    </div>
  );
}
