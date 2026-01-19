
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sqxbnlkwrzudotgiiusx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxeGJubGt3cnp1ZG90Z2lpdXN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzI4OTE4MywiZXhwIjoyMDgyODY1MTgzfQ.xEaNH0BsWkWdLYBAvjmdHSiTVQUjR1J33suFC7fhESw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkScan(scanId) {
    console.log(`Checking scan: ${scanId}`);

    // 1. Check scan
    const { data: scan, error: scanError } = await supabase
        .from('scans')
        .select('*')
        .eq('id', scanId)
        .single();

    if (scanError) {
        console.error('Scan error:', scanError);
        return;
    }
    console.log('Scan found:', scan.id, 'Status:', scan.status, 'Analyzed:', scan.items_analyzed);

    // 2. Check articles
    const { data: articles, error: articlesError } = await supabase
        .from('articles')
        .select('id, title, scan_id')
        .eq('scan_id', scanId);

    if (articlesError) {
        console.error('Articles error:', articlesError);
        return;
    }
    console.log(`Found ${articles.length} articles for this scan.`);

    if (articles.length > 0) {
        const articleIds = articles.map(a => a.id);

        // 3. Check analyses for these articles
        const { data: analyses, error: analysesError } = await supabase
            .from('analyses')
            .select('id, article_id, impact_score, categories')
            .in('article_id', articleIds);

        if (analysesError) {
            console.error('Analyses error:', analysesError);
            return;
        }
        console.log(`Found ${analyses.length} analyses for these articles.`);
    }

    // 4. Try the exact query used in the API
    console.log('\n--- API Query Simulation ---');
    const { data: apiData, error: apiError } = await supabase
        .from('scans')
        .select(`
      *,
      articles (
        *,
        analyses (*)
      )
    `)
        .eq('id', scanId)
        .single();

    if (apiError) {
        console.error('API-style query error:', apiError);
    } else {
        console.log('API-style query succeeded.');
        console.log('Articles in API query:', apiData.articles?.length || 0);
        const firstArticle = apiData.articles?.[0];
        if (firstArticle) {
            console.log('First article title:', firstArticle.title);
            console.log('First article analyses content:', firstArticle.analyses);
            console.log('Type of analyses field:', typeof firstArticle.analyses);
        }
    }
}

const scanId = '57021af7-f245-415a-9fe7-0f04c4742d02';
checkScan(scanId);
