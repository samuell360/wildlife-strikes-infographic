import pandas as pd
import numpy as np
import os
import warnings
warnings.filterwarnings('ignore')

BASE = r"C:\Users\samue\OneDrive\Desktop\DTA final Project"
ARCHIVE = os.path.join(BASE, "archive")
CSV_IN = os.path.join(ARCHIVE, "STRIKE_REPORTS.csv")

print("=" * 70)
print("LOADING CSV...")
print("=" * 70)
df_raw = pd.read_csv(CSV_IN, low_memory=False, encoding='latin1')
print(f"Raw shape: {df_raw.shape}")
print("Raw columns (first 50):", list(df_raw.columns[:50]))
print("Raw columns (next 50):", list(df_raw.columns[50:]))

# ============================================================
# STEP 1: DATA CLEANING
# ============================================================
print("\n" + "=" * 70)
print("STEP 1a: COLUMN SELECTION")
print("=" * 70)

DESIRED = [
    'INDEX_NR', 'INCIDENT_DATE', 'INCIDENT_MONTH', 'INCIDENT_YEAR',
    'TIME_OF_DAY', 'AIRPORT_ID', 'AIRPORT', 'STATE', 'FAAREGION',
    'PHASE_OF_FLIGHT', 'HEIGHT', 'SPEED', 'SPECIES', 'SPECIES_ID',
    'BIRDS_SEEN', 'SIZE', 'AC_CLASS', 'AC_MASS', 'NUM_ENGS',
    'DAMAGE_LEVEL', 'STR_ENG1', 'STR_ENG2', 'STR_ENG3', 'STR_ENG4',
    'STR_WING_ROT', 'STR_FUSE', 'STR_LG', 'STR_TAIL', 'STR_LGHTS',
    'STR_NOSE', 'STR_OTHER', 'COST_REPAIRS', 'COST_REPAIRS_INFL_ADJ',
    'COST_OTHER', 'COST_OTHER_INFL_ADJ', 'AOS', 'NR_INJURIES',
    'NR_FATALITIES', 'EFFECT', 'INDICATED_DAMAGE', 'WARNED'
]

# Build a case-insensitive map
col_upper = {c.upper(): c for c in df_raw.columns}
mapping = {}
missing = []
for d in DESIRED:
    if d in df_raw.columns:
        mapping[d] = d
    elif d.upper() in col_upper:
        mapping[d] = col_upper[d.upper()]
    else:
        # try replacing underscores with spaces and vice versa
        alt = d.replace('_', ' ')
        alt_upper = alt.upper()
        if alt_upper in col_upper:
            mapping[d] = col_upper[alt_upper]
        else:
            missing.append(d)

print(f"Mapped {len(mapping)} columns. Missing: {missing}")

# Select and rename
select_cols = list(mapping.values())
df = df_raw[select_cols].copy()
df.columns = list(mapping.keys())
print("Final columns after selection:")
print(list(df.columns))

# ============================================================
print("\n" + "=" * 70)
print("STEP 1b: FILTERING TO AC_CLASS == 'A'")
print("=" * 70)
df['AC_CLASS'] = df['AC_CLASS'].astype(str).str.strip().str.upper()
df = df[df['AC_CLASS'] == 'A'].copy()
print(f"Rows after AC_CLASS=='A' filter: {len(df)}")

# ============================================================
print("\n" + "=" * 70)
print("STEP 1c: DATA TYPE FIXES")
print("=" * 70)

# Datetime
df['INCIDENT_DATE'] = pd.to_datetime(df['INCIDENT_DATE'], errors='coerce')
print(f"INCIDENT_DATE nulls: {df['INCIDENT_DATE'].isna().sum()}")

# Integer year/month
df['INCIDENT_YEAR'] = pd.to_numeric(df['INCIDENT_YEAR'], errors='coerce').astype('Int64')
df['INCIDENT_MONTH'] = pd.to_numeric(df['INCIDENT_MONTH'], errors='coerce').astype('Int64')

# Numeric height/speed
df['HEIGHT'] = pd.to_numeric(df['HEIGHT'], errors='coerce')
df['SPEED'] = pd.to_numeric(df['SPEED'], errors='coerce')
print(f"HEIGHT non-null: {df['HEIGHT'].notna().sum()}, SPEED non-null: {df['SPEED'].notna().sum()}")

# STR_* columns → 0/1
str_cols = [c for c in df.columns if c.startswith('STR_')]
print(f"STR columns: {str_cols}")
for c in str_cols:
    raw_vals = df[c].dropna().unique()
    # map Y/1/True/yes → 1, everything else → 0
    df[c] = df[c].astype(str).str.strip().str.upper()
    df[c] = df[c].map(lambda x: 1 if x in ('Y', '1', 'TRUE', 'YES', 'T') else 0)
print("STR columns sample (first 3 rows):")
print(df[str_cols].head(3))

# Numeric cost
df['COST_REPAIRS_INFL_ADJ'] = pd.to_numeric(df['COST_REPAIRS_INFL_ADJ'], errors='coerce')
df['COST_REPAIRS'] = pd.to_numeric(df['COST_REPAIRS'], errors='coerce')
df['COST_OTHER'] = pd.to_numeric(df['COST_OTHER'], errors='coerce')
df['COST_OTHER_INFL_ADJ'] = pd.to_numeric(df['COST_OTHER_INFL_ADJ'], errors='coerce')
df['AOS'] = pd.to_numeric(df['AOS'], errors='coerce')
df['NR_INJURIES'] = pd.to_numeric(df['NR_INJURIES'], errors='coerce')
df['NR_FATALITIES'] = pd.to_numeric(df['NR_FATALITIES'], errors='coerce')

# DAMAGE_LEVEL clean
df['DAMAGE_LEVEL'] = df['DAMAGE_LEVEL'].astype(str).str.strip().str.upper()
valid_dmg = {'N', 'M', 'M?', 'S', 'D'}
df['DAMAGE_LEVEL'] = df['DAMAGE_LEVEL'].where(df['DAMAGE_LEVEL'].isin(valid_dmg), other=np.nan)
print(f"DAMAGE_LEVEL value counts:")
print(df['DAMAGE_LEVEL'].value_counts(dropna=False))

# ============================================================
print("\n" + "=" * 70)
print("STEP 1d: SPECIES CLEANUP")
print("=" * 70)

def clean_species(s):
    if pd.isna(s):
        return 'Unknown animal'
    s = str(s).strip()
    sl = s.lower()
    if 'unknown bird' in sl or sl.startswith('unknown bird'):
        return 'Unknown bird'
    if sl.startswith('unknown') and 'bird' not in sl:
        return 'Unknown animal'
    return s

df['SPECIES_CLEAN'] = df['SPECIES'].apply(clean_species)
print("Top 20 SPECIES_CLEAN values:")
print(df['SPECIES_CLEAN'].value_counts().head(20))

# ============================================================
print("\n" + "=" * 70)
print("STEP 1e: COMPONENT STRUCK ROLLUP")
print("=" * 70)

component_cols = ['STR_ENG1', 'STR_ENG2', 'STR_ENG3', 'STR_ENG4',
                  'STR_WING_ROT', 'STR_NOSE', 'STR_FUSE', 'STR_TAIL',
                  'STR_LG', 'STR_LGHTS', 'STR_OTHER']
# Only use cols that exist
component_cols = [c for c in component_cols if c in df.columns]

def primary_component2(row):
    for c in ['STR_ENG1', 'STR_ENG2', 'STR_ENG3', 'STR_ENG4']:
        if c in row.index and row[c]:
            return 'Engine'
    if 'STR_WING_ROT' in row.index and row['STR_WING_ROT']:
        return 'Wing/Rotor'
    if 'STR_NOSE' in row.index and row['STR_NOSE']:
        return 'Nose/Radome'
    if 'STR_FUSE' in row.index and row['STR_FUSE']:
        return 'Fuselage'
    if 'STR_TAIL' in row.index and row['STR_TAIL']:
        return 'Tail'
    if 'STR_LG' in row.index and row['STR_LG']:
        return 'Landing Gear'
    if 'STR_LGHTS' in row.index and row['STR_LGHTS']:
        return 'Lights'
    if 'STR_OTHER' in row.index and row['STR_OTHER']:
        return 'Other'
    return 'None/Unknown'

df['COMPONENT_STRUCK'] = df[component_cols].apply(primary_component2, axis=1)
print("COMPONENT_STRUCK value counts:")
print(df['COMPONENT_STRUCK'].value_counts())

# Long-form component table
comp_map = {
    'STR_ENG1': 'Engine', 'STR_ENG2': 'Engine', 'STR_ENG3': 'Engine', 'STR_ENG4': 'Engine',
    'STR_WING_ROT': 'Wing/Rotor', 'STR_NOSE': 'Nose/Radome', 'STR_FUSE': 'Fuselage',
    'STR_TAIL': 'Tail', 'STR_LG': 'Landing Gear', 'STR_LGHTS': 'Lights', 'STR_OTHER': 'Other'
}
long_rows = []
for col, comp in comp_map.items():
    if col in df.columns:
        sub = df[df[col] == 1][['INDEX_NR']].copy()
        sub['COMPONENT_STRUCK'] = comp
        long_rows.append(sub)

strike_long = pd.concat(long_rows).drop_duplicates(subset=['INDEX_NR', 'COMPONENT_STRUCK'])
strike_long.to_csv(os.path.join(BASE, 'strike_components_long.csv'), index=False)
print(f"strike_components_long.csv: {len(strike_long)} rows")

print("\nSTEP 1 SUMMARY:")
print(f"Total rows: {len(df)}, Columns: {len(df.columns)}")
print(df.info())

# ============================================================
# STEP 2: ANALYSIS
# ============================================================
print("\n" + "=" * 70)
print("STEP 2a: SECTION 1 STATS (THE HOOK)")
print("=" * 70)
total_strikes = len(df)
print(f"Total commercial (AC_CLASS=A) strikes: {total_strikes:,}")

yearly = df.groupby('INCIDENT_YEAR').size().reset_index(name='count')
yearly.columns = ['year', 'count']
print("\nStrikes per year:")
print(yearly.to_string(index=False))

latest_year = int(yearly['year'].max())
latest_count = int(yearly[yearly['year'] == latest_year]['count'].iloc[0])
daily_rate = latest_count / 365
print(f"\nLatest full year: {latest_year}, strikes: {latest_count:,}, daily rate: {daily_rate:.1f}")

monthly = df.groupby('INCIDENT_MONTH').size().reset_index(name='count')
monthly.columns = ['month', 'count']
print("\nStrikes by month:")
print(monthly.to_string(index=False))
peak_month = int(monthly.loc[monthly['count'].idxmax(), 'month'])
trough_month = int(monthly.loc[monthly['count'].idxmin(), 'month'])
print(f"Peak month: {peak_month}, Trough month: {trough_month}")

# ============================================================
print("\n" + "=" * 70)
print("STEP 2b: SECTION 2 STATS (FLIGHT PATH)")
print("=" * 70)
phase_counts = df['PHASE_OF_FLIGHT'].value_counts()
print("Strikes by phase of flight:")
print(phase_counts)

phase_height = df.groupby('PHASE_OF_FLIGHT')['HEIGHT'].mean().sort_values(ascending=False)
print("\nAverage HEIGHT by phase:")
print(phase_height)

below_500 = df[df['HEIGHT'] < 500].shape[0]
below_1000 = df[df['HEIGHT'] < 1000].shape[0]
height_known = df['HEIGHT'].notna().sum()
pct_500 = below_500 / height_known * 100
pct_1000 = below_1000 / height_known * 100
print(f"\nStrikes below 500 ft: {below_500:,} ({pct_500:.1f}% of height-known strikes)")
print(f"Strikes below 1000 ft: {below_1000:,} ({pct_1000:.1f}% of height-known strikes)")

# ============================================================
print("\n" + "=" * 70)
print("STEP 2c: SECTION 3 STATS (93/7 SPLIT)")
print("=" * 70)
dmg_counts = df['DAMAGE_LEVEL'].value_counts(dropna=False)
dmg_pct = df['DAMAGE_LEVEL'].value_counts(dropna=False, normalize=True) * 100
print("DAMAGE_LEVEL counts and percentages:")
for lvl in dmg_counts.index:
    print(f"  {lvl}: {dmg_counts[lvl]:,} ({dmg_pct[lvl]:.1f}%)")

no_damage_pct = dmg_pct.get('N', 0)
damage_pct = 100 - no_damage_pct
print(f"\nNone (N): {no_damage_pct:.1f}%")
print(f"Any damage (M+M?+S+D): {damage_pct:.1f}%")

serious = df[df['DAMAGE_LEVEL'].isin(['S', 'D'])].shape[0]
print(f"Substantial (S) or Destroyed (D): {serious:,}")

# ============================================================
print("\n" + "=" * 70)
print("STEP 2d: SECTION 4 STATS (SANKEY)")
print("=" * 70)
df_dmg = df[df['DAMAGE_LEVEL'].isin(['M', 'M?', 'S', 'D'])].copy()
print(f"Damaging strikes total: {len(df_dmg):,}")

print("\nTop 10 species in damaging strikes:")
top_species_dmg = df_dmg['SPECIES_CLEAN'].value_counts().head(10)
print(top_species_dmg)

print("\nPhase of flight in damaging strikes:")
print(df_dmg['PHASE_OF_FLIGHT'].value_counts())

print("\nComponent struck in damaging strikes:")
print(df_dmg['COMPONENT_STRUCK'].value_counts())

top5_species = list(df_dmg['SPECIES_CLEAN'].value_counts().head(5).index)
print("\nTop 5 species × most common phase:")
for sp in top5_species:
    sub = df_dmg[df_dmg['SPECIES_CLEAN'] == sp]
    top_phase = sub['PHASE_OF_FLIGHT'].value_counts().idxmax() if len(sub) > 0 else 'N/A'
    print(f"  {sp}: {top_phase}")

print("\nTop 5 species × most common component:")
for sp in top5_species:
    sub = df_dmg[df_dmg['SPECIES_CLEAN'] == sp]
    top_comp = sub['COMPONENT_STRUCK'].value_counts().idxmax() if len(sub) > 0 else 'N/A'
    print(f"  {sp}: {top_comp}")

# ============================================================
print("\n" + "=" * 70)
print("STEP 2e: SECTION 5 STATS (MAP)")
print("=" * 70)
top_airports = df.groupby(['AIRPORT_ID', 'AIRPORT']).size().reset_index(name='count').sort_values('count', ascending=False).head(20)
print("Top 20 airports by strike count:")
print(top_airports.to_string(index=False))

top_states = df['STATE'].value_counts().head(10)
print("\nTop 10 states:")
print(top_states)

# ============================================================
print("\n" + "=" * 70)
print("STEP 2f: SECTION 6 STATS (CLOSING)")
print("=" * 70)
df_serious = df[df['DAMAGE_LEVEL'].isin(['S', 'D'])].copy()
total_cost = df_serious['COST_REPAIRS_INFL_ADJ'].sum()
total_aos = df['AOS'].sum()
total_injuries = df['NR_INJURIES'].sum()
total_fatalities = df['NR_FATALITIES'].sum()
destroyed = df[df['DAMAGE_LEVEL'] == 'D'].shape[0]

print(f"Total inflation-adj cost (S+D strikes): ${total_cost:,.0f}")
print(f"Total AOS (all strikes): {total_aos:,.0f} days")
print(f"Total injuries: {total_injuries:,.0f}")
print(f"Total fatalities: {total_fatalities:,.0f}")
print(f"Aircraft destroyed (D): {destroyed:,}")

# ============================================================
# STEP 3: EXPORT
# ============================================================
print("\n" + "=" * 70)
print("STEP 3: EXPORTING FILES")
print("=" * 70)

# Main cleaned file
out_main = os.path.join(BASE, 'wildlife_strikes_clean.csv')
df.to_csv(out_main, index=False)
sz = os.path.getsize(out_main) / 1024 / 1024
print(f"wildlife_strikes_clean.csv: {len(df):,} rows, {sz:.1f} MB")

# agg_yearly.csv
agg_yearly = df.groupby('INCIDENT_YEAR').size().reset_index(name='count')
agg_yearly.columns = ['year', 'count']
p = os.path.join(BASE, 'agg_yearly.csv')
agg_yearly.to_csv(p, index=False)
print(f"agg_yearly.csv: {len(agg_yearly)} rows, {os.path.getsize(p)/1024:.1f} KB")

# agg_monthly.csv
agg_monthly = df.groupby('INCIDENT_MONTH').size().reset_index(name='count')
agg_monthly.columns = ['month', 'count']
p = os.path.join(BASE, 'agg_monthly.csv')
agg_monthly.to_csv(p, index=False)
print(f"agg_monthly.csv: {len(agg_monthly)} rows, {os.path.getsize(p)/1024:.1f} KB")

# agg_phase.csv
agg_phase = df.groupby('PHASE_OF_FLIGHT').agg(
    count=('INDEX_NR', 'count'),
    avg_height=('HEIGHT', 'mean')
).reset_index()
agg_phase.columns = ['phase', 'count', 'avg_height']
agg_phase = agg_phase.sort_values('count', ascending=False)
p = os.path.join(BASE, 'agg_phase.csv')
agg_phase.to_csv(p, index=False)
print(f"agg_phase.csv: {len(agg_phase)} rows, {os.path.getsize(p)/1024:.1f} KB")

# agg_damage.csv
dmg_agg = df['DAMAGE_LEVEL'].value_counts(dropna=False).reset_index()
dmg_agg.columns = ['damage_level', 'count']
dmg_agg['percentage'] = (dmg_agg['count'] / dmg_agg['count'].sum() * 100).round(2)
p = os.path.join(BASE, 'agg_damage.csv')
dmg_agg.to_csv(p, index=False)
print(f"agg_damage.csv: {len(dmg_agg)} rows, {os.path.getsize(p)/1024:.1f} KB")

# sankey_links.csv
# Only damaging strikes
df_s = df[df['DAMAGE_LEVEL'].isin(['M', 'M?', 'S', 'D'])].copy()

# Top 8 species for sankey
top8_sp = list(df_s['SPECIES_CLEAN'].value_counts().head(8).index)
df_s['sp_label'] = df_s['SPECIES_CLEAN'].apply(lambda x: x if x in top8_sp else 'Other')

# Phases with > 50 damaging strikes
phase_counts_dmg = df_s['PHASE_OF_FLIGHT'].value_counts()
valid_phases = list(phase_counts_dmg[phase_counts_dmg > 50].index)
df_s['ph_label'] = df_s['PHASE_OF_FLIGHT'].apply(lambda x: x if x in valid_phases else 'Other')

# Components with > 50 damaging strikes
comp_counts_dmg = df_s['COMPONENT_STRUCK'].value_counts()
valid_comps = list(comp_counts_dmg[comp_counts_dmg > 50].index)
df_s['co_label'] = df_s['COMPONENT_STRUCK'].apply(lambda x: x if x in valid_comps else 'Other')

# Layer 1: species → phase
sp_ph = df_s.groupby(['sp_label', 'ph_label']).size().reset_index(name='value')
sp_ph['source'] = 'species:' + sp_ph['sp_label']
sp_ph['target'] = 'phase:' + sp_ph['ph_label']

# Layer 2: phase → component
ph_co = df_s.groupby(['ph_label', 'co_label']).size().reset_index(name='value')
ph_co['source'] = 'phase:' + ph_co['ph_label']
ph_co['target'] = 'component:' + ph_co['co_label']

sankey = pd.concat([
    sp_ph[['source', 'target', 'value']],
    ph_co[['source', 'target', 'value']]
])
p = os.path.join(BASE, 'sankey_links.csv')
sankey.to_csv(p, index=False)
print(f"sankey_links.csv: {len(sankey)} rows, {os.path.getsize(p)/1024:.1f} KB")

# Verify no source-target overlaps between layers
sp_nodes = set(sankey[sankey['source'].str.startswith('species:')]['source'])
ph_source_nodes = set(sankey[sankey['source'].str.startswith('phase:')]['source'])
ph_target_nodes = set(sankey[sankey['target'].str.startswith('phase:')]['target'])
comp_nodes = set(sankey[sankey['target'].str.startswith('component:')]['target'])
overlap_check = sp_nodes & comp_nodes
print(f"Sankey layer overlap check (should be empty): {overlap_check}")
print(f"  Species nodes: {len(sp_nodes)}")
print(f"  Phase nodes (as source): {len(ph_source_nodes)}")
print(f"  Phase nodes (as target): {len(ph_target_nodes)}")
print(f"  Component nodes: {len(comp_nodes)}")

# agg_airports.csv — check if lat/lon columns exist
lat_col = next((c for c in df_raw.columns if 'LAT' in c.upper()), None)
lon_col = next((c for c in df_raw.columns if 'LON' in c.upper() or 'LONG' in c.upper()), None)
print(f"\nLat column found: {lat_col}, Lon column found: {lon_col}")

if lat_col and lon_col:
    geo_src = df_raw[df_raw['AC_CLASS'].astype(str).str.strip().str.upper() == 'A'].copy()
    agg_airports = geo_src.groupby(['AIRPORT_ID', 'AIRPORT', 'STATE']).agg(
        count=('INDEX_NR', 'count'),
        latitude=(lat_col, 'first'),
        longitude=(lon_col, 'first')
    ).reset_index().sort_values('count', ascending=False).head(50)
else:
    agg_airports = df.groupby(['AIRPORT_ID', 'AIRPORT', 'STATE']).size().reset_index(name='count')
    agg_airports.columns = ['airport_id', 'airport_name', 'state', 'count']
    agg_airports['latitude'] = ''
    agg_airports['longitude'] = ''
    agg_airports = agg_airports.sort_values('count', ascending=False).head(50)

if 'airport_id' not in agg_airports.columns:
    agg_airports.columns = ['airport_id', 'airport_name', 'state', 'count', 'latitude', 'longitude']

p = os.path.join(BASE, 'agg_airports.csv')
agg_airports.to_csv(p, index=False)
print(f"agg_airports.csv: {len(agg_airports)} rows, {os.path.getsize(p)/1024:.1f} KB")

# agg_closing.csv
agg_closing = pd.DataFrame({
    'metric': ['total_cost_infl_adj', 'aircraft_destroyed', 'total_aos', 'total_injuries', 'total_fatalities'],
    'value': [round(total_cost, 2), destroyed, int(total_aos), int(total_injuries), int(total_fatalities)]
})
p = os.path.join(BASE, 'agg_closing.csv')
agg_closing.to_csv(p, index=False)
print(f"agg_closing.csv: {len(agg_closing)} rows, {os.path.getsize(p)/1024:.1f} KB")

# ============================================================
print("\n" + "=" * 70)
print("FINAL SUMMARY FOR INFOGRAPHIC")
print("=" * 70)
print(f"Total commercial strikes (1990–{latest_year}): {total_strikes:,}")
print(f"Latest year ({latest_year}) daily strike rate: {daily_rate:.1f} per day")
peak_month_names = {1:'January',2:'February',3:'March',4:'April',5:'May',6:'June',
                    7:'July',8:'August',9:'September',10:'October',11:'November',12:'December'}
print(f"Peak strike month: {peak_month_names.get(peak_month, peak_month)}")
print(f"Trough strike month: {peak_month_names.get(trough_month, trough_month)}")
print(f"\n% strikes with no damage (N): {dmg_pct.get('N', 0):.1f}%")
print(f"% strikes with any damage: {(100 - dmg_pct.get('N', 0)):.1f}%")
print(f"Substantial or Destroyed: {serious:,}")
print(f"Aircraft destroyed: {destroyed:,}")
print(f"\nTotal inflation-adj cost (S+D): ${total_cost:,.0f}")
print(f"Total AOS days: {total_aos:,.0f}")
print(f"Total injuries: {total_injuries:,.0f}")
print(f"Total fatalities: {total_fatalities:,.0f}")
print(f"\nTop damaging species (top 5):")
for sp, cnt in df_dmg['SPECIES_CLEAN'].value_counts().head(5).items():
    print(f"  {sp}: {cnt:,}")
print(f"\nTop phase of flight overall:")
print(df['PHASE_OF_FLIGHT'].value_counts().head(5))
print(f"\nBelow 500 ft AGL: {pct_500:.1f}% of height-known strikes")
print(f"Below 1000 ft AGL: {pct_1000:.1f}% of height-known strikes")
print("\nAll output files saved to:", BASE)
