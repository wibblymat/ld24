# autotracker-bottomup - the quite a few times more ultimate audio experience
# by Ben "GreaseMonkey" Russell, 2011. Public domain.
#
#
#
# BUGS:
# - sometimes gets stuck in an infinite loop. attempted to alleviate it but it doesn't work.
# - i think it sometimes jumps further than an octave in some situations
# oh and:
# - has moments where it sounds bad. if you can fix this for good, let me know!

import sys, struct, random
import math

# tunables.
SMP_FREQ = 44100
SMP_16BIT = True

# IT format constants. leave these alone.
IT_FLAG_STEREO = 0x01
IT_FLAG_VOL0MIX = 0x02 # absolutely useless since 1.04.
IT_FLAG_INSTR = 0x04
IT_FLAG_LINEAR = 0x08
IT_FLAG_OLDEFF = 0x10 # don't enable this, it's not well documented.
IT_FLAG_COMPATGXX = 0x20 # don't enable this, it's not well documented.
IT_FLAG_PWHEEL = 0x40 # MIDI-related, don't use
IT_FLAG_USEMIDI = 0x80 # undocumented MIDI crap, don't use
IT_SPECIAL_MESSAGE = 0x01 # MIDI-related, don't use
IT_SPECIAL_UNK1 = 0x02 # undocumented MIDI crap, don't use
IT_SPECIAL_UNK2 = 0x04 # undocumented MIDI crap, don't use
IT_SPECIAL_HASMIDI = 0x08 # undocumented MIDI crap, don't use
IT_SAMPLE_EXISTS = 0x01
IT_SAMPLE_16BIT = 0x02
IT_SAMPLE_STEREO = 0x04 # don't use, it's a modplugism.
IT_SAMPLE_IT214 = 0x08 # not supported yet - don't use.
IT_SAMPLE_LOOP = 0x10
IT_SAMPLE_SUS = 0x20 # mikmod doesn't like this, so be wary.
IT_SAMPLE_LOOPBIDI = 0x40
IT_SAMPLE_SUSBIDI = 0x80
# IT_CONVERT_* refers to the sample conversion flags.
# this is a VERY internal feature and not widely implemented.
# please ensure you ONLY use IT_CONVERT_SIGNED for normal samples.
# EXCEPTION: IT_CONVERT_DELTA + IT_SAMPLE_IT214 = IT215 compression.
IT_CONVERT_SIGNED = 0x01
IT_CONVERT_BIGEND = 0x02
IT_CONVERT_DELTA = 0x04
IT_CONVERT_BYTEDELT = 0x08
IT_CONVERT_TXWAVE = 0x10
IT_CONVERT_STEREO = 0x20

# anyhow, here's some code. enjoy.
IT_BASEFLG_SAMPLE = (
       IT_SAMPLE_EXISTS
    | (IT_SAMPLE_16BIT if SMP_16BIT else 0)
)

##########################
#                        #
#   IT MODULE HANDLING   #
#                        #
##########################

# NOTE: Currently only writes data.
class ITFile:
    def __init__(self):
        self.name = "autotracker-bu module"
        self.flags = IT_FLAG_STEREO
        self.highlight = 0x1004
        self.ordlist = []
        self.inslist = []
        self.smplist = []
        self.patlist = []
        self.chnpan = [32 for i in xrange(64)]
        self.chnvol = [64 for i in xrange(64)]
        self.version = 0x0217
        self.vercompat = 0x0200
        self.flags = (
              IT_FLAG_STEREO
            | IT_FLAG_VOL0MIX # in the exceptionally rare case it may help...
            | IT_FLAG_LINEAR
        )
        self.special = (
              IT_SPECIAL_MESSAGE
        )
        self.gvol = 128
        self.mvol = 48
        self.tempo = random.randint(90,160)
        self.speed = 3
        self.pitchwheel = 0
        self.pansep = 128
        self.message = (
              "Generated with Autotracker-Bu\n"
            + "2011 Ben \"GreaseMonkey\" Russell - Public domain\n"
        )

    def enqueue_ptr(self, call):
        self.ptrq.append((self.fp.tell(),call))
        self.write("00PS")

    def save(self, fname):
        self.fp = open(fname,"wb")

        self.message_fixed = self.message.replace("\n\r","\n").replace("\n","\r") + "\x00\x00"

        self.ptrq = []
        self.doheader(self)

        while self.ptrq:
            pos, f = self.ptrq.pop(0)
            t = self.fp.tell()
            self.fp.seek(pos)
            self.write(struct.pack("<I",t))
            self.fp.seek(t)
            f(self)

        self.fp.close()

    def w_msg(self, fp):
        fp.write(self.message_fixed)

    def doheader(self, fp):
        ordlist = self.ordlist[:]
        if (not ordlist) or ordlist[-1] != 0xFF:
            ordlist.append(0xFF)

        fp.write("IMPM")
        fp.write_padded(25, self.name)
        fp.write(struct.pack("<HHHHHHHHH"
            ,self.highlight
            ,len(ordlist),len(self.inslist),len(self.smplist),len(self.patlist)
            ,self.version,self.vercompat,self.flags,self.special
        ))
        fp.write(struct.pack("<BBBBBBH"
            ,self.gvol,self.mvol,self.speed,self.tempo
            ,self.pansep,self.pitchwheel,len(self.message_fixed)
        ))
        fp.enqueue_ptr(self.w_msg)
        fp.write("AtBu")
        fp.write(''.join(chr(v) for v in self.chnpan))
        fp.write(''.join(chr(v) for v in self.chnvol))

        fp.write(''.join(chr(v) for v in ordlist))

        l = self.inslist + self.smplist + self.patlist
        for i in xrange(len(l)):
            self.enqueue_ptr(l[i].write)

        fp.write(struct.pack("<HI",0,0))

    def write(self, data):
        self.fp.write(data)

    def write_padded(self, length, s, addnull = True):
        if len(s) < length:
            s += "\x00"*(length-len(s))
        else:
            s = s[:length]

        assert len(s) == length, "STUPID! write_padded gave wrong length!"

        self.write(s)

        if addnull:
            self.write("\x00")

    def write_sample_array(self, data):
        # TODO: allow for a compressor / proper saturator
        if SMP_16BIT:
            for v in data:
                d = max(-0x8000,min(0x7FFF,int(v * 0x7FFF)))
                self.write(struct.pack("<h", d))
        else:
            for v in data:
                d = max(-0x80,min(0x7F,int(v * 0x7F)))
                self.write(struct.pack("<b",d))

    def smp_add(self, smp):
        self.smplist.append(smp)
        idx = len(self.smplist)
        return idx

    def pat_add(self, pat):
        idx = len(self.patlist)
        self.patlist.append(pat)
        return idx

    def ord_add(self, order):
        self.ordlist.append(order)

class Sample:
    name = "feed me with a sample :)"
    flags = 0
    boost = 1.0

    fname = "AUTOTRKR.BU"
    gvol = 64
    vol = 64
    defpan = 32 # NOTE: set top bit (0x80) to actually use default pan
    convert = IT_CONVERT_SIGNED
    lpbeg = 0
    lpend = 0
    freq = SMP_FREQ
    susbeg = 0
    susend = 0
    vibspeed = 0
    vibdepth = 0
    vibrate = 0
    vibtype = 0

    def __init__(self, name = None, gvol = None, *args, **kwargs):
        if name != None:
            self.name = name
        if gvol != None:
            self.gvol = gvol

        self.data = self.generate(*args, **kwargs)
        self.length = len(self.data)
        self.amplify()

    def write(self, fp):
        fp.write("IMPS")
        fp.write_padded(12, self.fname)
        fp.write(struct.pack("<BBB", self.gvol, self.flags, self.vol))
        fp.write_padded(25, self.name)
        fp.write(struct.pack("<BB", self.convert, self.defpan))
        fp.write(struct.pack("<IIIIII"
            ,self.length, self.lpbeg, self.lpend, self.freq
            ,self.susbeg, self.susend))
        fp.enqueue_ptr(self.write_data)
        fp.write(struct.pack("<BBBB", self.vibspeed, self.vibdepth, self.vibrate, self.vibtype))

    def write_data(self, fp):
        fp.write_sample_array(self.data)

    def amplify(self):
        l = -0.0000000001
        h = 0.0000000001
        for v in self.data:#[len(self.data)//32:]:
            if v < l:
                l = v
            if v > h:
                h = v

        amp = self.boost / max(-l,h)
        #print amp

        for i in xrange(len(self.data)):
            self.data[i] *= amp

    def generate(self, *args, **kwargs):
        return []

class Pattern:
    def __init__(self, rows):
        self.rows = rows
        assert rows >= 4, "too few rows" # note, this is just so modplug doesn't whinge. IT can handle 1-row patterns.
        assert rows <= 200, "too many rows" # on the other hand, IT chunders if you have more than 200 rows.
        self.data = [[[253,0,255,0,0] for j in xrange(64)] for i in xrange(rows)]

        # these are the defaults...
        # - note = 253 (0xFD)
        # - instrument = 0
        # - volume = 255 (0xFF)
        # - effect type = 0
        # - effect parameter = 0

    def write(self, fp):
        self.dopack()
        fp.write(struct.pack("<HH", len(self.packbuf), len(self.data)))
        fp.write("AtBu")
        fp.write(''.join(chr(v) for v in self.packbuf))

    def dopack(self):
        self.packbuf = []
        lc = [[253,0,255,0,0] for j in xrange(64)]
        lm = [0x00 for j in xrange(64)]
        for l in self.data:
            for i in xrange(64):
                c = l[i]
                m = 0x00
                if c[0] != 253:
                    m |= 0x10 if c[0] == lc[i][0] else 0x01
                if c[1] != 0:
                    m |= 0x20 if c[1] == lc[i][1] else 0x02
                if c[2] != 255:
                    m |= 0x40 if c[2] == lc[i][2] else 0x04
                if c[3] != 0 or c[4] != 0:
                    m |= 0x80 if c[3] == lc[i][3] and c[4] == lc[i][4] else 0x08

                v = i+1
                if m != lm[i]:
                    v |= 0x80
                self.packbuf.append(v)

                if v & 0x80:
                    self.packbuf.append(m)
                    lm[i] = m

                if m & 0x01:
                    self.packbuf.append(c[0])
                    lc[i][0] = c[0]
                if m & 0x02:
                    self.packbuf.append(c[1])
                    lc[i][1] = c[1]
                if m & 0x04:
                    self.packbuf.append(c[2])
                    lc[i][2] = c[2]
                if m & 0x08:
                    self.packbuf.append(c[3])
                    self.packbuf.append(c[4])
                    lc[i][3] = c[3]
                    lc[i][4] = c[4]

            self.packbuf.append(0)

#########################
#                       #
#   BLEEPS 'N' BLOOPS   #
#                       #
#########################

# YES! We actually have an almost decent sample synth!
class Sample_KS(Sample):
    name = "Karplus-Strong synth"
    flags = IT_BASEFLG_SAMPLE | IT_SAMPLE_LOOP
    boost = 1.0
    def generate(self, freq, decay, filtn, length_sec, nfrqmul = 1.0, filt0 = 1.0, filtf = 1.0, filtdc = 0.01):
        # generate waveform
        delay = int(SMP_FREQ/freq)
        noise = [0 for i in xrange(delay)]

        nfrqctr = 1.0
        nfrqval = 0.0

        intlen = int(SMP_FREQ*length_sec)
        assert intlen >= delay, "KS sample length cannot be less than its period"

        # DC filter
        dq = 0.0

        # prefilter with filt0
        qn = 0.0
        q = 0.0
        dl = -0.001
        dh = 0.001

        nvolcur = 1.0
        nvoldec = 1.0 / (decay * SMP_FREQ)

        nlfsr = random.randint(1,0x7FFF)

        # generate up to "length" samples
        qf = 0.0 #noise[-1]
        l = []
        i = 0
        for j in xrange(intlen):
            #ov = noise[i]
            if nvolcur > 0.0:
                if nfrqctr >= 1.0:
                    #nfrqval = random.random()*2.0-1.0
                    nfrqval = (1.0 if (nlfsr & 1) else -1.0) * 1.0

                    # skip a value to balance it a bit better
                    if nlfsr == 1:
                        nlfsr = 0x4000

                    if nlfsr & 1:
                        nlfsr = (nlfsr>>1) ^ 0x6000
                    else:
                        nlfsr >>= 1
                    nfrqctr -= 1.0
                nfrqctr += nfrqmul
                qn = (nfrqval * nvolcur - qn) * filt0 + qn
                nvolcur -= nvoldec
                noise[i] += qn

            ov = q = noise[i] = (noise[i] - q) * filtn + q
            qf = (ov - qf) * filtf + qf
            dq += (qf - dq) * filtdc
            l.append(qf - dq)
            i = (i+1) % delay

        # set stuff
        self.lpend = intlen
        self.lpbeg = intlen - delay

        # return
        return l

class Sample_Kicker(Sample):
    name = "Kicker"
    flags = IT_BASEFLG_SAMPLE
    boost = 1.8
    def generate(self):
        vol_noise = 0.8
        vol_sine = 1.2
        vol_noise_decay = 1.0 / (SMP_FREQ * 0.01)
        vol_sine_decay = 1.0 / (SMP_FREQ * 0.2)

        q_noise = 0.0

        kickmul = math.pi*2.0*150.0/SMP_FREQ
        offs_sine = 0.0
        offs_sine_speed = kickmul
        offs_sine_decay = 0.9995

        intlen = int(SMP_FREQ*0.25)
        l = []
        for j in xrange(intlen):
            sv = max(-0.7,min(0.7,math.sin(offs_sine)))
            offs_sine += offs_sine_speed
            offs_sine_speed *= offs_sine_decay

            nv = (random.random()*2.0-1.0)
            q_noise += (nv - q_noise) * 0.1
            nv = q_noise

            l.append(nv*vol_noise + sv*vol_sine)
            vol_noise -= vol_noise_decay
            if vol_noise < 0.0:
                vol_noise = 0.0
            vol_sine -= vol_sine_decay
            if vol_sine < 0.0:
                vol_sine = 0.0


        return l

class Sample_NoiseHit(Sample):
    name = "Noise hit generator"
    flags = IT_BASEFLG_SAMPLE
    boost = 1.0
    def generate(self, decay, filtl = 1.0, filth = 0.0):
        vol_noise = 1.0
        vol_noise_decay = 1.0 / (SMP_FREQ * decay)

        ql = 0.0
        qh = 0.0

        intlen = int(SMP_FREQ*decay)
        l = []
        for j in xrange(intlen):
            nv = (random.random()*2.0-1.0)
            ql += (nv - ql) * filtl
            qh += (nv - qh) * filth
            nv = ql - qh

            l.append(nv*vol_noise)
            vol_noise -= vol_noise_decay
            if vol_noise < 0.0:
                vol_noise = 0.0

        return l

class Sample_Hoover(Sample):
    name = "Hoover"
    flags = IT_BASEFLG_SAMPLE | IT_SAMPLE_LOOP
    boost = 1.0

    def generate(self, freq):
        oscfrq = [
            int(freq*(v + v*(random.random()*2.0-1.0)*0.002))/float(SMP_FREQ)
            for v in [0.25, 0.5, 1.0, 2.0]
        ]

        oscvibspeed = [float(random.randint(1,5))*2.0*math.pi/SMP_FREQ for i in xrange(4)]
        oscvibdepth = [0.5,0.4,0.2,0.2]
        oscoffs = [random.random() for i in xrange(4)]
        oscviboffs = [random.random() for i in xrange(4)]
        oscvol = [1.0, 1.0, 1.0, 0.55]

        attack = 0.03
        atkvol = 0.0
        atkspd = 1.0/(attack*SMP_FREQ)

        intlen = int(SMP_FREQ*(attack+1.0))

        l = []
        for i in xrange(intlen):
            v = 0.0
            for j in xrange(4):
                ov = oscoffs[j]*2.0-1.0
                vib = math.sin(oscviboffs[j])*oscvibdepth[j]
                oscoffs[j] += oscfrq[j] * (2.0**(vib/12.0))
                if oscoffs[j] > 1.0:
                    oscoffs[j] %= 1.0
                oscviboffs[j] += oscvibspeed[j]
                v += oscvol[j]*ov

            atkvol += atkspd
            if atkvol > 1.0:
                atkvol = 1.0
            l.append(v*atkvol)

        self.lpend = intlen
        self.lpbeg = int(intlen - SMP_FREQ*1.0 + 0.5)

        return l

##########################
#                        #
#   RANDOCHORD FACTORY   #
#                        #
##########################

class Key:
    def __init__(self):
        pass

    def get_base_note(self):
        return 60

    def has_note(self, n):
        return True

class Key_GenericOctave(Key):
    MASK = [True]*12
    def __init__(self, basenote):
        self.basenote = basenote

    def get_base_note(self):
        return self.basenote

    def has_note(self, n):
        return self.MASK[(n-self.basenote)%12]

class Key_Major(Key_GenericOctave):
    MASK = [
        True,False,
        True,False,
        True,
        True,False,
        True,False,
        True,False,
        True,
    ]

class Key_Minor(Key_GenericOctave):
    MASK = [
        True,False,
        True,
        True,False,
        True,False,
        True,
        True,False,
        True,False,
    ]

class Key_Major_Pentatonic(Key_GenericOctave):
    MASK = [
        True,False,
        True,False,
        True,
        False,False,
        True,False,
        True,False,
        False,
    ]

class Key_Minor_Pentatonic(Key_GenericOctave):
    MASK = [
        True,False,
        False,
        True,False,
        True,False,
        True,
        False,False,
        True,False,
    ]

class Strategy:
    def __init__(self, *args, **kwargs):
        self.setup(*args,**kwargs)
        self.gens = []
        self.chused = 0

    def setup(self, *args, **kwargs):
        self.key = Key_GenericOctave(60)

    def gen_add(self, gen):
        self.gens.append((self.chused,gen))
        self.chused += gen.size()

    def get_key(self):
        return self.key

class Strategy_Main(Strategy):
    def setup(self, basenote, keytype, patsize, blocksize, *args, **kwargs):
        self.basenote = basenote
        self.keytype = keytype
        self.patsize = patsize
        self.blocksize = blocksize
        self.key = keytype(basenote)
        self.pats = []
        self.rspeed = 2**random.randint(2,3)

        self.rhythm = [3]+[0]*(self.rspeed-1)+[1]+[0]*(self.rspeed-1)
        self.rhythm *= (self.patsize//len(self.rhythm))

        self.pat_idx = 0

        self.newkseq()

    def newkseq(self):
        self.kseq = random.choice({
            Key_Minor: [
                [(0,Key_Minor),(-4,Key_Major),(5,Key_Major),(-2,Key_Major)],
                [(0,Key_Minor),(-2,Key_Major),(-4,Key_Major),(-5,Key_Minor)],
            ],
            Key_Major: [
                [(0,Key_Major),(-5,Key_Major),(-3,Key_Minor),(5,Key_Major)],
                [(0,Key_Major),(0,Key_Major),(-7,Key_Minor),(-5,Key_Major)],
            ],
        }[self.keytype])

        self.kseq2 = random.choice({
            Key_Minor: [
                [(3,Key_Major),(0,Key_Minor),(-4,Key_Major),(-2,Key_Major)],
                [(-4,Key_Major),(-2,Key_Major),(0,Key_Minor),(-2,Key_Major)],
            ],
            Key_Major: [
                [(2,Key_Minor),(0,Key_Major),(-3,Key_Minor),(0,Key_Major)],
                [(-3,Key_Minor),(-5,Key_Major),(-7,Key_Major),(-5,Key_Major)],
            ],
        }[self.keytype])

    def get_pattern(self):
        pat = Pattern(self.patsize)

        kseq = self.kseq2[:] if self.pat_idx % 8 >= 4 else self.kseq[:]

        for i in xrange(0,self.patsize,self.blocksize):
            k,kt = kseq.pop(0)
            kchord = kt(self.basenote+k)
            for chn,gen in self.gens:
                gen.apply_notes(chn, pat, self, self.rhythm, i, self.blocksize, self.key, kchord)

            kseq.append(k)

        self.pats.append(pat)

        self.pat_idx += 1

        return pat

    def get_key(self):
        return self.key

class Generator:
    def __init__(self, *args, **kwargs):
        pass

    def size(self):
        return 1

    def apply_notes(self, chn, pat, strat, rhythm, bbeg, blen, kroot, kchord):
        pass

class Generator_Bass(Generator):
    def __init__(self, smp, *args, **kwargs):
        self.smp = smp

    def size(self):
        return 1

    def apply_notes(self, chn, pat, strat, rhythm, bbeg, blen, kroot, kchord):
        base = kchord.get_base_note()

        leadin = 0

        for row in xrange(bbeg, bbeg+blen, 1):
            if rhythm[row]&1:
                n = base-12 if random.random() < 0.5 else base
                pat.data[row][chn] = [n, self.smp, 255, 0, 0]

                if leadin != 0 and random.random() < 0.4:
                    gran = 2
                    count = 1

                    #if random.random() < 0.2:
                    #   gran = 1

                    if leadin > gran*2 and random.random() < 0.4:
                        count += 1
                        if leadin > gran*3 and random.random() < 0.4:
                            count += 1

                    for j in xrange(count):
                        pat.data[row-(j+1)*gran][chn] = [
                             base+12 if random.random() < 0.5 else base
                            ,self.smp
                            ,0xFF
                            ,ord('S')-ord('A')+1
                            ,0xC0 + random.randint(1,2)
                        ]

                if random.random() < 0.2:
                    pat.data[row][chn][0] += 12
                    if random.random() < 0.4:
                        pat.data[row][chn][3] = ord('S')-ord('A')+1
                        pat.data[row][chn][4] = 0xC0 + random.randint(1,2)
                    else:
                        pat.data[row+2][chn] = [254, self.smp, 255, 0, 0]

                leadin = 0
            else:
                leadin += 1

class Generator_AmbientMelody(Generator):
    MOTIF_PROSPECTS = [
        # 1-steps
        [1],
        [2],
        [3],

        # 2-steps
        [1,3],
        [2,3],
        [2,4],

        # niceties
        [5,7],
        [5,12],
        [7,12],
        [7],
        [5],
        [12],

        # 3-chords
        [3,7],
        [4,7],

        # 4-chords
        [3,7,10],
        [3,7,11],
        [4,7,10],
        [4,7,11],

        # turns and stuff
        [1,0],
        [2,0],
        [1,-1,0],
        [1,-2,0],
        [2,-1,0],
        [2,-2,0],
    ]

    def __init__(self, smp, *args, **kwargs):
        self.smp = smp
        self.beatrow = 2**random.randint(2,3)
        self.lq = 60
        self.ln = -1
        self.mq = []
        self.nq = []

    def size(self):
        return 1

    def apply_notes(self, chn, pat, strat, rhythm, bbeg, blen, kroot, kchord):
        base = kchord.get_base_note()
        if bbeg == 0:
            self.lq = base
            self.ln = -1
            self.mq = []
            self.nq = []

        pat.data[bbeg][chn] = [self.lq, self.smp, 255, 0, 0]
        self.nq.append(bbeg)
        #self.ln = self.lq

        stabbing = False

        row = bbeg
        while row < bbeg+blen:
            if pat.data[row][chn][0] != 253:
                self.nq.append(row)

                row += self.beatrow
                continue

            q = 60

            if self.mq:
                if stabbing or random.random() < 0.9:
                    n = self.mq.pop(0)
                    self.ln = n
                    pat.data[row][chn] = [n, self.smp, 255, 0, 0]
                    self.nq.append(row)

                    if not self.mq:
                        self.lq = n

                    if random.random() < 0.2 or stabbing:
                        row += self.beatrow // 2
                        stabbing = not stabbing
                    else:
                        row += self.beatrow
                else:
                    row += self.beatrow
            elif row-bbeg >= 2*self.beatrow and random.random() < 0.3:
                backstep = random.randint(3,min(10,row//(self.beatrow//2)))*(self.beatrow//2)
                print "back", row, backstep

                for i in xrange(backstep):
                    if row-bbeg >= blen:
                        break
                    pat.data[row][chn] = pat.data[row-backstep][chn][:]
                    n = pat.data[row][chn][0]
                    if n != 253:
                        self.ln = self.lq = n
                    row += 1
            else:
                if len(self.nq) > 5:
                    self.nq = self.nq[-5:]

                while True:
                    kk = False
                    while True:
                        rbi = random.choice(self.nq)
                        rbn = pat.data[rbi][chn][0]

                        if self.ln != -1 and abs(rbn-self.ln) > 12:
                            continue

                        break

                    m = None
                    print rbn
                    for j in xrange(20):
                        m = random.choice(self.MOTIF_PROSPECTS)

                        down = random.random() < (8.0+(self.ln-base))/8.0 if self.ln != -1 else 0.5

                        print m,rbn,down,base
                        if down:
                            m = [rbn-v for v in m]
                        else:
                            m = [rbn+v for v in m]


                        if self.ln == m[0]:
                            continue

                        k = True
                        for v in m:
                            if not (kchord.has_note(v) and kroot.has_note(v)):
                                k = False
                                break

                        if k:
                            kk = True
                            break

                    if kk:
                        break


                if rbn != self.ln:
                    m = [rbn] + m

                print m
                self.mq += m

                # repeat at same row

class Generator_Drums(Generator):
    def __init__(self, s_kick, s_hhc, s_hho, s_snare, *args, **kwargs):
        self.s_kick = s_kick
        self.s_hhc = s_hhc
        self.s_hho = s_hho
        self.s_snare = s_snare
        self.beatrow = 2**random.randint(1,2)

    def size(self):
        return 3

    def apply_notes(self, chn, pat, strat, rhythm, bbeg, blen, kroot, kchord):
        for row in xrange(bbeg,bbeg+blen,self.beatrow):
            vol = 255
            smp = self.s_hhc
            if not (rhythm[row]&2):
                if (row&8):
                    vol = 48
                if (row&4):
                    vol = 32
                if (row&2):
                    vol = 16
                if (row&1):
                    vol = 8

                if random.random() < 0.2:
                    smp = self.s_hho

            pat.data[row][chn] = [60, smp, vol, 0, 0]

        for row in xrange(bbeg,bbeg+blen,2):
            if random.random() < 0.1 and not rhythm[row]&1:
                pat.data[row][chn+1] = [60,self.s_kick,255,0,0]

        did_kick = False
        for row in xrange(bbeg,bbeg+blen,1):
            if rhythm[row]&1:
                if did_kick:
                    pat.data[row][chn+2] = [60,self.s_snare,255,0,0]
                else:
                    if random.random() < 0.1:
                        pat.data[row+2][chn+1] = [60,self.s_kick,255,0,0]
                    else:
                        pat.data[row][chn+1] = [60,self.s_kick,255,0,0]

                did_kick = not did_kick


#################
#               #
#   BOOTSTRAP   #
#               #
#################

MIDDLE_C = 220.0 * (2.0 ** (3.0 / 12.0))

print "Creating module"
itf = ITFile()

print "Generating samples"
# these could do with some work, they're a bit crap ATM --GM
# note: commented a couple out as they use a fair whack of space and are unused.
SMP_GUITAR = itf.smp_add(Sample_KS(name = "KS Guitar", freq = MIDDLE_C/2, decay = 0.005, nfrqmul = 1.0, filt0 = 0.1, filtn = 0.6, filtf = 0.0004, length_sec = 1.0))
SMP_BASS = itf.smp_add(Sample_KS(name = "KS Bass", freq = MIDDLE_C/4, decay = 0.005, nfrqmul = 0.5, filt0 = 0.2, filtn = 0.2, filtf = 0.005, length_sec = 0.7))
#SMP_PIANO = itf.smp_add(Sample_KS(name = "KS Piano", freq = MIDDLE_C, decay = 0.07, nfrqmul = 0.02, filtdc = 0.1, filt0 = 0.09, filtn = 0.6, filtf = 0.4, length_sec = 1.0))
#SMP_HOOVER = itf.smp_add(Sample_Hoover(name = "Hoover", freq = MIDDLE_C))

SMP_KICK = itf.smp_add(Sample_Kicker(name = "Kick"))
SMP_HHC = itf.smp_add(Sample_NoiseHit(name = "NH Hihat Closed", gvol = 32, decay = 0.03, filtl = 0.99, filth = 0.20))
SMP_HHO = itf.smp_add(Sample_NoiseHit(name = "NH Hihat Open", gvol = 32, decay = 0.5, filtl = 0.99, filth = 0.20))
SMP_SNARE = itf.smp_add(Sample_NoiseHit(name = "NH Snare", decay = 0.12, filtl = 0.15, filth = 0.149))


print "Generating patterns"
strat = Strategy_Main(random.randint(50,50+12-1)+12, Key_Minor if random.random() < 0.6 else Key_Major, 128, 32)
strat.gen_add(Generator_Drums(s_kick = SMP_KICK, s_snare = SMP_SNARE, s_hhc = SMP_HHC, s_hho = SMP_HHO))
strat.gen_add(Generator_AmbientMelody(smp = SMP_GUITAR))
strat.gen_add(Generator_Bass(smp = SMP_BASS))
for i in xrange(6):
    itf.ord_add(itf.pat_add(strat.get_pattern()))

print "Saving"

# pick a random name
RN_NOUNS = [
    ("cat","cats"),("kitten","kittens"),
    ("dog","dogs"),("puppy","puppies"),
    ("elf","elves"),("knight","knights"),
    ("wizard","wizards"),("witch","witches"),("leprechaun","leprechauns"),
    ("dwarf","dwarves"),("golem","golems"),("troll","trolls"),
    ("city","cities"),("castle","castles"),("town","towns"),("village","villages"),
    ("journey","journeys"),("flight","flights"),("place","places"),
    ("bird","birds"),
    ("ocean","oceans"),("sea","seas"),
    ("boat","boats"),("ship","ships"),
    ("whale","whales"),
    ("brother","brothers"),("sister","sisters"),
    ("viking","vikings"),("ghost","ghosts"),
    ("garden","gardens"),("park","parks"),
    ("forest","forests"),("ogre","ogres"),
    ("sweet","sweets"),("candy","candies"),
    ("hand","hands"),("foot","feet"),("arm","arms"),("leg","legs"),
    ("body","bodies"),("head","heads"),("wing","wings"),
    ("gorilla","gorillas"),("ninja","ninjas"),("bear","bears"),
    ("vertex","vertices"),("matrix","matrices"),("simplex","simplices"),
    ("shape","shapes"),
    ("apple","apples"),("pear","pears"),("banana","bananas"),
    ("orange","oranges"),
    ("demoscene","demoscenes"),
    ("sword","swords"),("shield","shields"),("gun","guns"),("cannon","cannons"),
    ("report","reports"),("sign","signs"),("year","years"),("age","ages"),
    ("blood","bloods"),("breed","breeds"),("monument","monuments"),
    ("cheese","cheeses"),("horse","horses"),("sheep","sheep"),("fish","fish"),
    ("dock","docks"),("tube","tubes"),("road","roads"),("path","paths"),
    ("tunnel","tunnels"),("retort","retorts"),
    ("toaster","toasters"),("goat","goats"),
    ("tofu","tofus"),("vine","vines"),("branch","branches"),

]

RN_ADJECTIVES = [
    "tense","grand","pleasing","absurd","offensive","crazed",
    "magic","lovely","tired","lively","tasty","jealous",
    "red","orange","yellow","green","blue","purple","pink","brown",
    "white","black","cheap","blazed","biased","sweet",
    "invisible","hidden","secret","long","short","tall","broken",
    "random","fighting","hunting","eating","drinking","drunk",
    "weary","walking","running","flying","strong","weak",
    "woeful","tearful","rich","poor","awoken","sacred",
]

RN_VERBS = [
    # TODO
]

RN_PATTERNS = [
    "the (n[0])'s (n[0,1])",
    "(N[0])'s (n[0,1])",
    "(n[0,1]) of (N[0,1])",
    "on the (n[0])'s (n[0,1])",
    "(n[0,1]) of the (n[0,1])",
    "the (a) (n[0,1])",
    "(A) (n[0])",
    "(a) (n[1])",
    "(a) and (a)",
    "(N[0,1]) and (N[0,1])",
]

def randoname():
    pat = random.choice(RN_PATTERNS)
    while "(" in pat:
        ps, po, pp = pat.partition("(")
        p, pc, pn = pp.partition(")")

        assert pc == ")", "expected ')' in name pattern"

        p = random.choice(p.split("|"))
        if p.startswith("n") or p.startswith("N"):
            idx = random.choice(eval(p[1:]))
            w = random.choice(RN_NOUNS)[idx]
            if idx in [0] and p.startswith("N"):
                if w[0] in "aeiouAEIOU":
                    p = "an " + w
                else:
                    p = "a " + w
            else:
                p = w
        elif p.startswith("a") or p.startswith("A"):
            w = random.choice(RN_ADJECTIVES)
            if p.startswith("A"):
                if w[0] in "aeiouAEIOU":
                    p = "an " + w
                else:
                    p = "a " + w
            else:
                p = w
        else:
            raise Exception("invalid name pattern type")

        pat = ps + p + pn

    return pat

name = randoname()
itf.name = name
fname = "bu-%s.it" % name.replace(" ","-").replace("'","")
if len(sys.argv) > 1:
    fname = sys.argv[1]
itf.save(fname)

print "Done"
print "Saved as \"%s\"" % fname
